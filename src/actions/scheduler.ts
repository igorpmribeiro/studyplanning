"use server";

import { db } from "@/db";
import { plannedSessions, subjects, topics, weeklyAvailabilities } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  PRIORIDADE_SCORE,
  DIFICULDADE_SCORE,
  STATUS_SCORE,
} from "@/lib/constants";
import type { ActionResult, PlannedSession, Topic, Subject } from "@/types";

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
  lastSubjectId: string | null;
}

function getMonday(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
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
    with: { topics: { orderBy: [asc(topics.nome)] } },
  });

  // Filter by selected subjects if provided
  if (selectedSubjectIds && selectedSubjectIds.length > 0) {
    allSubjects = allSubjects.filter((s) => selectedSubjectIds.includes(s.id));
  }

  if (allSubjects.length === 0) {
    return { success: false, error: "Cadastre pelo menos uma matéria com subtópicos." };
  }

  const allTopics = allSubjects.flatMap((s) =>
    s.topics
      .filter((t) => t.status !== "concluido")
      .map((t) => ({ topic: t, subject: s }))
  );

  if (allTopics.length === 0) {
    return { success: false, error: "Todos os subtópicos estão concluídos." };
  }

  // 2. Score and sort topics
  const scoredTopics: ScoredTopic[] = allTopics.map(({ topic, subject }) => {
    const prioridadeNum = PRIORIDADE_SCORE[subject.prioridade as keyof typeof PRIORIDADE_SCORE] ?? 2;
    const pesoNum = subject.peso;
    const dificuldadeNum = DIFICULDADE_SCORE[topic.dificuldade as keyof typeof DIFICULDADE_SCORE] ?? 2;
    const statusNum = STATUS_SCORE[topic.status as keyof typeof STATUS_SCORE] ?? 2;

    const score = pesoNum * 3 + prioridadeNum + dificuldadeNum + statusNum;
    return { topic, subject, score };
  });

  scoredTopics.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.subject.nome.localeCompare(b.subject.nome);
  });

  // 3. Build daily budgets
  const monday = getMonday(weekStartDate);
  const availMinPerDay = [
    availability.segundaMin,
    availability.tercaMin,
    availability.quartaMin,
    availability.quintaMin,
    availability.sextaMin,
    availability.sabadoMin,
    availability.domingoMin,
  ];

  // Load existing completed sessions for this week
  const weekDates = Array.from({ length: 7 }, (_, i) => formatDate(addDays(monday, i)));
  const existingCompleted = await db
    .select()
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.status, "concluida")
      )
    );

  const completedThisWeek = existingCompleted.filter((s) =>
    weekDates.includes(s.data)
  );

  const days: DayBudget[] = availMinPerDay.map((availMin, i) => ({
    index: i,
    date: weekDates[i],
    availableMin: availMin,
    usedMin: 0,
    sessions: [],
    lastSubjectId: null,
  }));

  // Subtract completed sessions from budgets
  for (const session of completedThisWeek) {
    const day = days[session.diaSemana];
    if (day) day.usedMin += session.duracaoMin;
  }

  // Track completed topic IDs to skip them
  const completedTopicIds = new Set(
    completedThisWeek
      .filter((s) => s.tipoSessao === "estudo")
      .map((s) => s.topicId)
  );

  // 4. Distribute study sessions
  const reviewQueue: Array<{
    topic: Topic;
    subject: Subject;
    studyDayIndex: number;
  }> = [];

  for (const { topic, subject } of scoredTopics) {
    if (completedTopicIds.has(topic.id)) continue;

    // Find best day: prefers subject alternation, then most remaining time
    const candidateDays = days.filter(
      (d) => d.availableMin - d.usedMin >= topic.tempoEstimadoMin
    );

    candidateDays.sort((a, b) => {
      const aAlternates = a.lastSubjectId !== subject.id ? 1 : 0;
      const bAlternates = b.lastSubjectId !== subject.id ? 1 : 0;
      if (bAlternates !== aAlternates) return bAlternates - aAlternates;
      return b.availableMin - b.usedMin - (a.availableMin - a.usedMin);
    });

    if (candidateDays.length === 0) continue;

    const bestDay = candidateDays[0];

    bestDay.sessions.push({
      planningId,
      data: bestDay.date,
      diaSemana: bestDay.index,
      subjectId: subject.id,
      topicId: topic.id,
      tipoSessao: "estudo",
      duracaoMin: topic.tempoEstimadoMin,
      ordemNoDia: bestDay.sessions.length + 1,
      status: "pendente",
    });

    bestDay.usedMin += topic.tempoEstimadoMin;
    bestDay.lastSubjectId = subject.id;

    reviewQueue.push({ topic, subject, studyDayIndex: bestDay.index });
  }

  // 5. Schedule review sessions
  for (const { topic, subject, studyDayIndex } of reviewQueue) {
    // Revisão 1: next available day after study (50% duration)
    const rev1Duration = Math.max(10, Math.ceil(topic.tempoEstimadoMin * 0.5));
    let rev1DayIndex = -1;

    for (let i = studyDayIndex + 1; i < 7; i++) {
      const day = days[i];
      if (day.availableMin - day.usedMin >= rev1Duration) {
        day.sessions.push({
          planningId,
          data: day.date,
          diaSemana: i,
          subjectId: subject.id,
          topicId: topic.id,
          tipoSessao: "revisao_1",
          duracaoMin: rev1Duration,
          ordemNoDia: day.sessions.length + 1,
          status: "pendente",
        });
        day.usedMin += rev1Duration;
        rev1DayIndex = i;
        break;
      }
    }

    // Revisão 2: at least 1-day gap after revisão 1 (30% duration)
    if (rev1DayIndex >= 0) {
      const rev2Duration = Math.max(10, Math.ceil(topic.tempoEstimadoMin * 0.3));

      for (let i = rev1DayIndex + 2; i < 7; i++) {
        const day = days[i];
        if (day.availableMin - day.usedMin >= rev2Duration) {
          day.sessions.push({
            planningId,
            data: day.date,
            diaSemana: i,
            subjectId: subject.id,
            topicId: topic.id,
            tipoSessao: "revisao_2",
            duracaoMin: rev2Duration,
            ordemNoDia: day.sessions.length + 1,
            status: "pendente",
          });
          day.usedMin += rev2Duration;
          break;
        }
      }
    }
  }

  // 6. Persist in transaction
  const allNewSessions = days.flatMap((d) => d.sessions);

  if (allNewSessions.length === 0) {
    return { success: false, error: "Não foi possível gerar sessões. Verifique a disponibilidade e os subtópicos cadastrados." };
  }

  // Delete pending sessions for this week, insert new ones
  const pendingThisWeek = await db
    .select()
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.status, "pendente")
      )
    );

  const pendingIdsThisWeek = pendingThisWeek
    .filter((s) => weekDates.includes(s.data))
    .map((s) => s.id);

  // Delete old pending sessions
  for (const id of pendingIdsThisWeek) {
    await db.delete(plannedSessions).where(eq(plannedSessions.id, id));
  }

  // Insert new sessions
  const inserted = await db.insert(plannedSessions).values(allNewSessions).returning();

  revalidatePath("/planejamento");
  revalidatePath("/");
  return { success: true, data: [...completedThisWeek, ...inserted] };
}

export async function completeSession(
  sessionId: string
): Promise<ActionResult<PlannedSession>> {
  const [updated] = await db
    .update(plannedSessions)
    .set({ status: "concluida", updatedAt: new Date() })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  if (!updated) return { success: false, error: "Sessão não encontrada" };

  revalidatePath("/planejamento");
  revalidatePath("/");
  return { success: true, data: updated };
}

export async function uncompleteSession(
  sessionId: string
): Promise<ActionResult<PlannedSession>> {
  const [updated] = await db
    .update(plannedSessions)
    .set({ status: "pendente", updatedAt: new Date() })
    .where(eq(plannedSessions.id, sessionId))
    .returning();

  if (!updated) return { success: false, error: "Sessão não encontrada" };

  revalidatePath("/planejamento");
  revalidatePath("/");
  return { success: true, data: updated };
}

export async function getSessions(planningId: string): Promise<PlannedSession[]> {
  return db
    .select()
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planningId))
    .orderBy(asc(plannedSessions.data), asc(plannedSessions.ordemNoDia));
}

export async function moveSession(
  sessionId: string,
  newDiaSemana: number,
  newDate: string,
  newOrder: string[]
): Promise<ActionResult> {
  // Update the moved session's day
  await db
    .update(plannedSessions)
    .set({
      diaSemana: newDiaSemana,
      data: newDate,
      updatedAt: new Date(),
    })
    .where(eq(plannedSessions.id, sessionId));

  // Update order for all sessions in the new order
  for (let i = 0; i < newOrder.length; i++) {
    await db
      .update(plannedSessions)
      .set({ ordemNoDia: i + 1, updatedAt: new Date() })
      .where(eq(plannedSessions.id, newOrder[i]));
  }

  revalidatePath("/planejamento");
  return { success: true, data: undefined };
}
