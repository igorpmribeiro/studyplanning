"use server";

import { db } from "@/db";
import { plannedSessions, subjects, topics } from "@/db/schema";
import { eq, and, isNotNull, ne, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { REVISAO_1_DIAS, REVISAO_2_DIAS } from "@/lib/constants";
import type { ActionResult } from "@/types";

export interface ReviewQueueItem {
  topicId: string;
  topicNome: string;
  subjectId: string;
  subjectNome: string;
  tipoRevisao: "revisao_1" | "revisao_2";
  studyCompletedAt: Date;
  revisao1CompletedAt: Date | null;
  dueDate: Date;
  daysUntilDue: number; // negative = atrasada
  hasScheduledSession: boolean;
  scheduledSessionId: string | null;
  scheduledDate: string | null;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Get Review Queue ───────────────────────────────────────

export async function getReviewQueue(planningId: string): Promise<ReviewQueueItem[]> {
  const planningSubjects = await db
    .select({ id: subjects.id, nome: subjects.nome })
    .from(subjects)
    .where(eq(subjects.planningId, planningId));

  if (planningSubjects.length === 0) return [];

  const subjectIds = planningSubjects.map((s) => s.id);
  const subjectMap = new Map(planningSubjects.map((s) => [s.id, s.nome]));

  const relevant = await db
    .select()
    .from(topics)
    .where(
      and(
        inArray(topics.subjectId, subjectIds),
        isNotNull(topics.studyCompletedAt),
        ne(topics.status, "concluido")
      )
    );

  if (relevant.length === 0) return [];

  const topicIds = relevant.map((t) => t.id);

  const pendingReviewSessions = await db
    .select()
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.status, "pendente"),
        inArray(plannedSessions.topicId, topicIds)
      )
    );

  const sessionByTopicAndType = new Map<string, (typeof pendingReviewSessions)[number]>();
  for (const s of pendingReviewSessions) {
    if (s.tipoSessao !== "revisao_1" && s.tipoSessao !== "revisao_2") continue;
    const key = `${s.topicId}:${s.tipoSessao}`;
    const existing = sessionByTopicAndType.get(key);
    if (!existing || s.data < existing.data) {
      sessionByTopicAndType.set(key, s);
    }
  }

  const today = startOfDay(new Date());
  const items: ReviewQueueItem[] = [];

  for (const t of relevant) {
    if (!t.studyCompletedAt) continue;

    const nextType: "revisao_1" | "revisao_2" =
      t.revisao1CompletedAt == null ? "revisao_1" : "revisao_2";

    if (nextType === "revisao_2" && t.revisao2CompletedAt != null) continue;

    const offset = nextType === "revisao_1" ? REVISAO_1_DIAS : REVISAO_2_DIAS;
    const dueDate = addDays(new Date(t.studyCompletedAt), offset);
    const daysUntilDue = diffInDays(dueDate, today);

    const session = sessionByTopicAndType.get(`${t.id}:${nextType}`);

    items.push({
      topicId: t.id,
      topicNome: t.nome,
      subjectId: t.subjectId,
      subjectNome: subjectMap.get(t.subjectId) ?? "—",
      tipoRevisao: nextType,
      studyCompletedAt: new Date(t.studyCompletedAt),
      revisao1CompletedAt: t.revisao1CompletedAt ? new Date(t.revisao1CompletedAt) : null,
      dueDate,
      daysUntilDue,
      hasScheduledSession: !!session,
      scheduledSessionId: session?.id ?? null,
      scheduledDate: session?.data ?? null,
    });
  }

  // Most overdue / soonest first
  items.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return items;
}

// ─── Mark Review Completed (from /revisoes page) ───────────

export async function markReviewCompleted(
  planningId: string,
  topicId: string,
  tipoRevisao: "revisao_1" | "revisao_2"
): Promise<ActionResult> {
  const [topic] = await db.select().from(topics).where(eq(topics.id, topicId));
  if (!topic) return { success: false, error: "Subtópico não encontrado" };

  const now = new Date();

  const existing = await db
    .select()
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.topicId, topicId),
        eq(plannedSessions.tipoSessao, tipoRevisao),
        eq(plannedSessions.status, "pendente")
      )
    );

  if (existing.length > 0) {
    await db
      .update(plannedSessions)
      .set({ status: "concluida", updatedAt: now })
      .where(eq(plannedSessions.id, existing[0].id));
  } else {
    const dayOfWeek = (now.getDay() + 6) % 7;
    const factor = tipoRevisao === "revisao_1" ? 0.5 : 0.3;
    const duracaoMin = Math.max(10, Math.ceil(topic.tempoEstimadoMin * factor));
    await db.insert(plannedSessions).values({
      planningId,
      data: formatDate(now),
      diaSemana: dayOfWeek,
      subjectId: topic.subjectId,
      topicId,
      tipoSessao: tipoRevisao,
      duracaoMin,
      ordemNoDia: 1,
      status: "concluida",
    });
  }

  if (tipoRevisao === "revisao_1") {
    await db
      .update(topics)
      .set({ revisao1CompletedAt: now, updatedAt: now })
      .where(eq(topics.id, topicId));

    const anchor = topic.studyCompletedAt ?? addDays(now, -REVISAO_1_DIAS);
    const rev2DateRaw = addDays(new Date(anchor), REVISAO_2_DIAS);
    const todayStart = startOfDay(now);
    const rev2Date = rev2DateRaw < todayStart ? todayStart : rev2DateRaw;
    const rev2DayOfWeek = (rev2Date.getDay() + 6) % 7;
    const rev2Duration = Math.max(10, Math.ceil(topic.tempoEstimadoMin * 0.3));

    await db.insert(plannedSessions).values({
      planningId,
      data: formatDate(rev2Date),
      diaSemana: rev2DayOfWeek,
      subjectId: topic.subjectId,
      topicId,
      tipoSessao: "revisao_2",
      duracaoMin: rev2Duration,
      ordemNoDia: 1,
      status: "pendente",
    });
  } else {
    await db
      .update(topics)
      .set({ status: "concluido", revisao2CompletedAt: now, updatedAt: now })
      .where(eq(topics.id, topicId));
  }

  revalidatePath("/revisoes");
  revalidatePath("/planejamento");
  revalidatePath("/materias");
  revalidatePath("/");
  return { success: true, data: undefined };
}

// ─── Count due reviews (for sidebar badge) ─────────────────

export async function getDueReviewsCount(planningId: string): Promise<number> {
  const queue = await getReviewQueue(planningId);
  return queue.filter((r) => r.daysUntilDue <= 0).length;
}

// ─── Due reviews for a given week (used by generateSchedule) ──

export interface DueReviewForWeek {
  topicId: string;
  subjectId: string;
  tipoSessao: "revisao_1" | "revisao_2";
  duracaoMin: number;
  targetDate: string;
}

export async function getDueReviewsForWeek(
  planningId: string,
  weekDates: string[]
): Promise<DueReviewForWeek[]> {
  const queue = await getReviewQueue(planningId);
  if (queue.length === 0 || weekDates.length === 0) return [];

  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const candidates = queue.filter((item) => {
    if (item.hasScheduledSession && item.scheduledDate && weekDates.includes(item.scheduledDate)) {
      return false;
    }
    const dueStr = formatDate(item.dueDate);
    if (item.daysUntilDue < 0) return true;
    return dueStr >= weekStart && dueStr <= weekEnd;
  });

  if (candidates.length === 0) return [];

  const topicIds = candidates.map((c) => c.topicId);
  const topicRows = await db.select().from(topics).where(inArray(topics.id, topicIds));
  const topicMap = new Map(topicRows.map((t) => [t.id, t]));

  return candidates.map((c) => {
    const topic = topicMap.get(c.topicId);
    const baseMin = topic?.tempoEstimadoMin ?? 30;
    const factor = c.tipoRevisao === "revisao_1" ? 0.5 : 0.3;
    const duracaoMin = Math.max(10, Math.ceil(baseMin * factor));
    const dueStr = formatDate(c.dueDate);
    const targetDate = weekDates.includes(dueStr) ? dueStr : weekStart;

    return {
      topicId: c.topicId,
      subjectId: c.subjectId,
      tipoSessao: c.tipoRevisao,
      duracaoMin,
      targetDate,
    };
  });
}
