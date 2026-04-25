"use server";

import { db } from "@/db";
import { plannedSessions, subjects, topics, weeklyAvailabilities } from "@/db/schema";
import { eq, and, asc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  PRIORIDADE_SCORE,
  DIFICULDADE_SCORE,
  STATUS_SCORE,
  REVISAO_1_DIAS,
  REVISAO_2_DIAS,
} from "@/lib/constants";
import type { ActionResult, PlannedSession, Topic, Subject } from "@/types";
import { getDueReviewsForWeek } from "./revisoes";

// ─── Helpers ────────────────────────────────────────────────

interface ScoredTopic {
  topic: Topic;
  subject: Subject;
  score: number;
}

interface DayBudget {
  index: number;
  date: string;
  availableMin: number;
  usedMin: number;
  sessions: Omit<typeof plannedSessions.$inferInsert, "id" | "createdAt" | "updatedAt">[];
  subjectIds: Set<string>; // track ALL subjects placed in this day
}

function getMonday(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Similarity: word overlap for grouping related topics ───

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .split(/\s+/)
      .filter((w) => w.length > 2) // ignore short words
  );
}

function similarity(a: string, b: string): number {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let overlap = 0;
  for (const w of tokA) if (tokB.has(w)) overlap++;
  return overlap / Math.max(tokA.size, tokB.size);
}

// ─── Generate Schedule ──────────────────────────────────────

export async function generateSchedule(
  planningId: string,
  weekStartDate?: string,
  selectedSubjectIds?: string[]
): Promise<ActionResult<PlannedSession[]>> {
  // 1. Load data
  const availability = await db.query.weeklyAvailabilities.findFirst({
    where: eq(weeklyAvailabilities.planningId, planningId),
  });

  if (!availability) {
    return { success: false, error: "Configure a disponibilidade semanal antes de gerar o planejamento." };
  }

  let allSubjects = await db.query.subjects.findMany({
    where: eq(subjects.planningId, planningId),
    with: { topics: { orderBy: [asc(topics.ordem), asc(topics.createdAt)] } },
  });

  if (selectedSubjectIds && selectedSubjectIds.length > 0) {
    allSubjects = allSubjects.filter((s) => selectedSubjectIds.includes(s.id));
  }

  if (allSubjects.length === 0) {
    return { success: false, error: "Cadastre pelo menos uma matéria com subtópicos." };
  }

  // 2. Score topics PER SUBJECT, then build round-robin queue
  const topicsBySubject: Map<string, ScoredTopic[]> = new Map();

  for (const subject of allSubjects) {
    // Topics arrive pre-sorted by `ordem` (import order = prerequisite order).
    // We only filter out completed topics; we keep the original order so that
    // prerequisite topics are scheduled before advanced ones.
    const scored = subject.topics
      .filter((t) => t.status !== "concluido")
      .map((t) => {
        const prioridadeNum = PRIORIDADE_SCORE[subject.prioridade as keyof typeof PRIORIDADE_SCORE] ?? 2;
        const dificuldadeNum = DIFICULDADE_SCORE[t.dificuldade as keyof typeof DIFICULDADE_SCORE] ?? 2;
        const statusNum = STATUS_SCORE[t.status as keyof typeof STATUS_SCORE] ?? 2;
        const score = subject.peso * 3 + prioridadeNum + dificuldadeNum + statusNum;
        return { topic: t, subject, score };
      });

    if (scored.length > 0) {
      topicsBySubject.set(subject.id, scored);
    }
  }

  if (topicsBySubject.size === 0) {
    return { success: false, error: "Todos os subtópicos estão concluídos." };
  }

  // Round-robin: pick 1 topic from each subject in rotation, ordered by subject priority
  const subjectOrder = allSubjects
    .filter((s) => topicsBySubject.has(s.id))
    .sort((a, b) => {
      const scoreA = (PRIORIDADE_SCORE[a.prioridade as keyof typeof PRIORIDADE_SCORE] ?? 2) + a.peso;
      const scoreB = (PRIORIDADE_SCORE[b.prioridade as keyof typeof PRIORIDADE_SCORE] ?? 2) + b.peso;
      return scoreB - scoreA;
    });

  const subjectQueues = new Map<string, ScoredTopic[]>();
  for (const s of subjectOrder) {
    subjectQueues.set(s.id, [...(topicsBySubject.get(s.id) ?? [])]);
  }

  // Interleave: take 1 from each subject in rotation
  const interleavedTopics: ScoredTopic[] = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const s of subjectOrder) {
      const queue = subjectQueues.get(s.id)!;
      if (queue.length > 0) {
        interleavedTopics.push(queue.shift()!);
        hasMore = hasMore || queue.length > 0;
      }
    }
  }

  // 3. Build daily budgets
  const monday = getMonday(weekStartDate);
  const availMinPerDay = [
    availability.segundaMin, availability.tercaMin, availability.quartaMin,
    availability.quintaMin, availability.sextaMin, availability.sabadoMin,
    availability.domingoMin,
  ];

  const weekDates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(monday, i)));

  const existingCompleted = await db
    .select()
    .from(plannedSessions)
    .where(and(eq(plannedSessions.planningId, planningId), eq(plannedSessions.status, "concluida")));

  const completedThisWeek = existingCompleted.filter((s) => weekDates.includes(s.data));

  // Pending sessions in this week that we want to PRESERVE (existing reviews)
  const pendingAll = await db
    .select()
    .from(plannedSessions)
    .where(and(eq(plannedSessions.planningId, planningId), eq(plannedSessions.status, "pendente")));

  const pendingThisWeek = pendingAll.filter((s) => weekDates.includes(s.data));
  const preservedReviews = pendingThisWeek.filter(
    (s) => s.tipoSessao === "revisao_1" || s.tipoSessao === "revisao_2"
  );

  const days: DayBudget[] = availMinPerDay.map((availMin, i) => ({
    index: i,
    date: weekDates[i],
    availableMin: availMin,
    usedMin: 0,
    sessions: [],
    subjectIds: new Set<string>(),
  }));

  for (const session of completedThisWeek) {
    const day = days[session.diaSemana];
    if (day) day.usedMin += session.duracaoMin;
  }

  // Account for preserved reviews: subtract their duration from day budget
  // (they're not added to day.sessions because they already exist in DB and shouldn't be re-inserted)
  for (const session of preservedReviews) {
    const day = days[session.diaSemana];
    if (day) day.usedMin += session.duracaoMin;
  }

  const completedTopicIds = new Set(
    completedThisWeek.filter((s) => s.tipoSessao === "estudo").map((s) => s.topicId)
  );

  // Inject due reviews (overdue or due this week) that aren't already scheduled
  const dueReviews = await getDueReviewsForWeek(planningId, weekDates);
  for (const review of dueReviews) {
    // Find the day matching targetDate
    let dayIdx = weekDates.indexOf(review.targetDate);
    if (dayIdx < 0) dayIdx = 0;

    // If the target day doesn't fit, search forward
    let placed = false;
    for (let attempt = 0; attempt < 7 && !placed; attempt++) {
      const idx = (dayIdx + attempt) % 7;
      const day = days[idx];
      if (day.availableMin - day.usedMin >= review.duracaoMin) {
        day.sessions.push({
          planningId,
          data: day.date,
          diaSemana: idx,
          subjectId: review.subjectId,
          topicId: review.topicId,
          tipoSessao: review.tipoSessao,
          duracaoMin: review.duracaoMin,
          ordemNoDia: day.sessions.length + 1,
          status: "pendente",
        });
        day.usedMin += review.duracaoMin;
        day.subjectIds.add(review.subjectId);
        placed = true;
      }
    }
    // If no day has space, the review is left for the user to schedule manually
  }

  // 4. Distribute study sessions with subject diversity per day
  // Supports splitting topics across multiple days when they don't fit in a single slot
  const MIN_SESSION_DURATION = 15; // minimum session size when splitting (minutes)
  const reviewQueue: Array<{ topic: Topic; subject: Subject; studyDayIndex: number }> = [];
  let dayPointer = 0; // round-robin across days too

  for (const { topic, subject } of interleavedTopics) {
    if (completedTopicIds.has(topic.id)) continue;

    let remainingDuration = topic.tempoEstimadoMin;
    let partNumber = 0;
    let placed = false;

    // Try to place the full topic in one day first (diversity-aware)
    for (let attempt = 0; attempt < 7; attempt++) {
      const dayIdx = (dayPointer + attempt) % 7;
      const day = days[dayIdx];
      const remaining = day.availableMin - day.usedMin;

      if (remaining >= topic.tempoEstimadoMin) {
        const sameSubjectCount = day.sessions.filter((s) => s.subjectId === subject.id).length;
        if (sameSubjectCount >= 2) continue;

        day.sessions.push({
          planningId,
          data: day.date,
          diaSemana: dayIdx,
          subjectId: subject.id,
          topicId: topic.id,
          tipoSessao: "estudo",
          duracaoMin: topic.tempoEstimadoMin,
          ordemNoDia: day.sessions.length + 1,
          status: "pendente",
        });

        day.usedMin += topic.tempoEstimadoMin;
        day.subjectIds.add(subject.id);
        reviewQueue.push({ topic, subject, studyDayIndex: dayIdx });
        dayPointer = (dayIdx + 1) % 7;
        placed = true;
        break;
      }
    }

    // Fallback: try any day with full space (no diversity limit)
    if (!placed) {
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const day = days[dayIdx];
        if (day.availableMin - day.usedMin >= topic.tempoEstimadoMin) {
          day.sessions.push({
            planningId,
            data: day.date,
            diaSemana: dayIdx,
            subjectId: subject.id,
            topicId: topic.id,
            tipoSessao: "estudo",
            duracaoMin: topic.tempoEstimadoMin,
            ordemNoDia: day.sessions.length + 1,
            status: "pendente",
          });
          day.usedMin += topic.tempoEstimadoMin;
          day.subjectIds.add(subject.id);
          reviewQueue.push({ topic, subject, studyDayIndex: dayIdx });
          placed = true;
          break;
        }
      }
    }

    // Split: topic doesn't fit in any single day — split across multiple days
    if (!placed) {
      const splitDays: number[] = [];

      for (let attempt = 0; attempt < 7 && remainingDuration > 0; attempt++) {
        const dayIdx = (dayPointer + attempt) % 7;
        const day = days[dayIdx];
        const dayRemaining = day.availableMin - day.usedMin;

        if (dayRemaining >= MIN_SESSION_DURATION) {
          const sessionDuration = Math.min(dayRemaining, remainingDuration);
          partNumber++;

          day.sessions.push({
            planningId,
            data: day.date,
            diaSemana: dayIdx,
            subjectId: subject.id,
            topicId: topic.id,
            tipoSessao: "estudo",
            duracaoMin: sessionDuration,
            ordemNoDia: day.sessions.length + 1,
            status: "pendente",
          });

          day.usedMin += sessionDuration;
          day.subjectIds.add(subject.id);
          remainingDuration -= sessionDuration;
          splitDays.push(dayIdx);
        }
      }

      if (splitDays.length > 0) {
        reviewQueue.push({ topic, subject, studyDayIndex: splitDays[0] });
        dayPointer = (splitDays[splitDays.length - 1] + 1) % 7;
      }
    }
  }

  // 5. Similarity optimization: reorder sessions within each day
  // Group related topics (same subject, similar names) together
  for (const day of days) {
    if (day.sessions.length <= 1) continue;

    const sorted = [...day.sessions];
    sorted.sort((a, b) => {
      // First group by subject
      if (a.subjectId !== b.subjectId) return a.subjectId.localeCompare(b.subjectId);
      // Then by similarity within subject (keep original order as proxy)
      return 0;
    });

    // Update ordemNoDia
    sorted.forEach((s, i) => { s.ordemNoDia = i + 1; });
    day.sessions = sorted;
  }

  // 6. Reviews are anchored to the topic's studyCompletedAt (Rev 1 = +10d, Rev 2 = +30d).
  // The scheduler injects due/overdue reviews into the week (step 3) and creates
  // future review sessions on demand inside completeSession.

  // 7. Persist
  const allNewSessions = days.flatMap((d) => d.sessions);

  if (allNewSessions.length === 0) {
    return { success: false, error: "Não foi possível gerar sessões. Verifique a disponibilidade e os subtópicos cadastrados." };
  }

  // Delete only pending ESTUDO sessions for this week (preserve existing reviews)
  const pendingEstudoIdsThisWeek = pendingThisWeek
    .filter((s) => s.tipoSessao === "estudo")
    .map((s) => s.id);

  if (pendingEstudoIdsThisWeek.length > 0) {
    await db.delete(plannedSessions).where(inArray(plannedSessions.id, pendingEstudoIdsThisWeek));
  }

  // Insert new sessions
  const inserted = await db.insert(plannedSessions).values(allNewSessions).returning();

  // 8. Update topic statuses to "em_andamento" for all scheduled topics
  const scheduledTopicIds = [...new Set(allNewSessions.map((s) => s.topicId))];
  if (scheduledTopicIds.length > 0) {
    await db
      .update(topics)
      .set({ status: "em_andamento", updatedAt: new Date() })
      .where(
        and(
          inArray(topics.id, scheduledTopicIds),
          eq(topics.status, "nao_iniciado")
        )
      );
  }

  revalidatePath("/planejamento");
  revalidatePath("/materias");
  revalidatePath("/");
  return { success: true, data: [...completedThisWeek, ...inserted] };
}

// ─── Complete Session (with status lifecycle) ───────────────

export async function completeSession(
  sessionId: string
): Promise<ActionResult<PlannedSession>> {
  const [session] = await db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.id, sessionId));

  if (!session) return { success: false, error: "Sessão não encontrada" };

  // Mark session as completed
  const [updated] = await db
    .update(plannedSessions)
    .set({ status: "concluida", updatedAt: new Date() })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  // Update topic status and completion timestamps based on session type
  const now = new Date();

  if (session.tipoSessao === "estudo") {
    // Study completed → topic goes to "revisando", record studyCompletedAt
    await db
      .update(topics)
      .set({ status: "revisando", studyCompletedAt: now, updatedAt: now })
      .where(eq(topics.id, session.topicId));

    // Schedule Revisão 1 anchored at study completion + REVISAO_1_DIAS
    const rev1Date = addDays(now, REVISAO_1_DIAS);
    const rev1DayOfWeek = (rev1Date.getDay() + 6) % 7; // 0=Monday
    const rev1Duration = Math.max(10, Math.ceil(session.duracaoMin * 0.5));

    await db.insert(plannedSessions).values({
      planningId: session.planningId,
      data: formatDate(rev1Date),
      diaSemana: rev1DayOfWeek,
      subjectId: session.subjectId,
      topicId: session.topicId,
      tipoSessao: "revisao_1",
      duracaoMin: rev1Duration,
      ordemNoDia: 1,
      status: "pendente",
    });
  } else if (session.tipoSessao === "revisao_1") {
    // Rev 1 completed → record revisao1CompletedAt, schedule Rev 2 anchored at study + REVISAO_2_DIAS
    const [topic] = await db
      .update(topics)
      .set({ revisao1CompletedAt: now, updatedAt: now })
      .where(eq(topics.id, session.topicId))
      .returning();

    // Anchor Rev 2 at studyCompletedAt + REVISAO_2_DIAS, fallback to now + (REVISAO_2_DIAS - REVISAO_1_DIAS)
    const anchor = topic?.studyCompletedAt ?? addDays(now, -REVISAO_1_DIAS);
    const rev2Date = addDays(anchor, REVISAO_2_DIAS);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const finalRev2Date = rev2Date < today ? today : rev2Date;
    const rev2DayOfWeek = (finalRev2Date.getDay() + 6) % 7;
    const rev2Duration = Math.max(10, Math.ceil(session.duracaoMin * 0.6));

    await db.insert(plannedSessions).values({
      planningId: session.planningId,
      data: formatDate(finalRev2Date),
      diaSemana: rev2DayOfWeek,
      subjectId: session.subjectId,
      topicId: session.topicId,
      tipoSessao: "revisao_2",
      duracaoMin: rev2Duration,
      ordemNoDia: 1,
      status: "pendente",
    });
  } else if (session.tipoSessao === "revisao_2") {
    // Rev 2 completed → topic is fully "concluido", record revisao2CompletedAt
    await db
      .update(topics)
      .set({ status: "concluido", revisao2CompletedAt: now, updatedAt: now })
      .where(eq(topics.id, session.topicId));
  }

  revalidatePath("/planejamento");
  revalidatePath("/materias");
  revalidatePath("/");
  return { success: true, data: updated };
}

// ─── Uncomplete Session ─────────────────────────────────────

export async function uncompleteSession(
  sessionId: string
): Promise<ActionResult<PlannedSession>> {
  const [session] = await db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.id, sessionId));

  if (!session) return { success: false, error: "Sessao nao encontrada" };

  // Revert the session to pending
  const [updated] = await db
    .update(plannedSessions)
    .set({ status: "pendente", updatedAt: new Date() })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  // Revert topic status and remove future reviews
  const now = new Date();

  if (session.tipoSessao === "estudo") {
    // Study was marked complete → topic went to "revisando", rev1 was scheduled
    // Revert topic to "em_andamento", clear studyCompletedAt, delete pending rev1
    await db
      .update(topics)
      .set({ status: "em_andamento", studyCompletedAt: null, updatedAt: now })
      .where(eq(topics.id, session.topicId));

    await db
      .delete(plannedSessions)
      .where(
        and(
          eq(plannedSessions.topicId, session.topicId),
          eq(plannedSessions.tipoSessao, "revisao_1"),
          eq(plannedSessions.status, "pendente")
        )
      );
  } else if (session.tipoSessao === "revisao_1") {
    // Rev1 was marked complete → rev2 was scheduled
    // Revert topic to "revisando", clear revisao1CompletedAt, delete pending rev2
    await db
      .update(topics)
      .set({ status: "revisando", revisao1CompletedAt: null, updatedAt: now })
      .where(eq(topics.id, session.topicId));

    await db
      .delete(plannedSessions)
      .where(
        and(
          eq(plannedSessions.topicId, session.topicId),
          eq(plannedSessions.tipoSessao, "revisao_2"),
          eq(plannedSessions.status, "pendente")
        )
      );
  } else if (session.tipoSessao === "revisao_2") {
    // Rev2 was marked complete → topic went to "concluido"
    // Revert topic to "revisando", clear revisao2CompletedAt
    await db
      .update(topics)
      .set({ status: "revisando", revisao2CompletedAt: null, updatedAt: now })
      .where(eq(topics.id, session.topicId));
  }

  revalidatePath("/planejamento");
  revalidatePath("/materias");
  revalidatePath("/");
  return { success: true, data: updated };
}

// ─── Delete Session ─────────────────────────────────────────

export async function deleteSession(
  sessionId: string
): Promise<ActionResult> {
  const deleted = await db
    .delete(plannedSessions)
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  if (deleted.length === 0) return { success: false, error: "Sessao nao encontrada" };

  revalidatePath("/planejamento");
  revalidatePath("/");
  return { success: true, data: undefined };
}

// ─── Save Session Notes ────────────────────────────────────

export async function saveSessionNotes(
  sessionId: string,
  notas: string
): Promise<ActionResult> {
  const [updated] = await db
    .update(plannedSessions)
    .set({ notas: notas || null, updatedAt: new Date() })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  if (!updated) return { success: false, error: "Sessão não encontrada" };

  revalidatePath("/planejamento");
  return { success: true, data: undefined };
}

// ─── Add Manual Session ─────────────────────────────────────

export async function addManualSession(
  planningId: string,
  topicId: string,
  diaSemana: number,
  date: string,
  duracaoMin: number
): Promise<ActionResult<PlannedSession>> {
  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId));
  if (!topic) return { success: false, error: "Subtopico nao encontrado" };

  // Get current max order for this day
  const daySessions = await db
    .select()
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.data, date)
      )
    );

  const maxOrder = daySessions.reduce((max, s) => Math.max(max, s.ordemNoDia), 0);

  const [inserted] = await db
    .insert(plannedSessions)
    .values({
      planningId,
      data: date,
      diaSemana,
      subjectId: topic.subjectId,
      topicId,
      tipoSessao: "estudo",
      duracaoMin,
      ordemNoDia: maxOrder + 1,
      status: "pendente",
    })
    .returning();

  revalidatePath("/planejamento");
  return { success: true, data: inserted };
}

// ─── Get Sessions ───────────────────────────────────────────

export async function getSessions(planningId: string): Promise<PlannedSession[]> {
  return db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planningId))
    .orderBy(asc(plannedSessions.data), asc(plannedSessions.ordemNoDia));
}

// ─── Get Sessions For Week ──────────────────────────────────

export async function getSessionsForWeek(
  planningId: string,
  weekDates: string[]
): Promise<PlannedSession[]> {
  const all = await db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planningId))
    .orderBy(asc(plannedSessions.data), asc(plannedSessions.ordemNoDia));

  return all.filter((s) => weekDates.includes(s.data));
}

// ─── Move Session (drag and drop) ───────────────────────────

export async function moveSession(
  sessionId: string,
  newDiaSemana: number,
  newDate: string,
  newOrder: string[]
): Promise<ActionResult> {
  const now = new Date();

  await Promise.all([
    db
      .update(plannedSessions)
      .set({ diaSemana: newDiaSemana, data: newDate, updatedAt: now })
      .where(eq(plannedSessions.id, sessionId)),
    ...newOrder.map((id, i) =>
      db
        .update(plannedSessions)
        .set({ ordemNoDia: i + 1, updatedAt: now })
        .where(eq(plannedSessions.id, id))
    ),
  ]);

  revalidatePath("/planejamento");
  return { success: true, data: undefined };
}

// ─── Change Session Topic ───────────────────────────────────

export async function changeSessionTopic(
  sessionId: string,
  newTopicId: string
): Promise<ActionResult<PlannedSession>> {
  // Verify the topic exists and get its data
  const [topic] = await db.select().from(topics).where(eq(topics.id, newTopicId));
  if (!topic) return { success: false, error: "Subtópico não encontrado" };

  const [updated] = await db
    .update(plannedSessions)
    .set({
      topicId: newTopicId,
      subjectId: topic.subjectId,
      duracaoMin: topic.tempoEstimadoMin,
      updatedAt: new Date(),
    })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  if (!updated) return { success: false, error: "Sessão não encontrada" };

  revalidatePath("/planejamento");
  return { success: true, data: updated };
}
