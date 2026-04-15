"use server";

import { db } from "@/db";
import { plannedSessions, subjects, quizSessions, quizAnswers, quizQuestions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

// ─── Study time by subject ─────────────────────────────────

export async function getStudyTimeBySubject(planningId: string) {
  const rows = await db
    .select({
      subjectId: plannedSessions.subjectId,
      subjectNome: subjects.nome,
      totalMin: sql<number>`COALESCE(SUM(${plannedSessions.duracaoMin}), 0)`,
    })
    .from(plannedSessions)
    .innerJoin(subjects, eq(plannedSessions.subjectId, subjects.id))
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.status, "concluida")
      )
    )
    .groupBy(plannedSessions.subjectId, subjects.nome)
    .orderBy(sql`SUM(${plannedSessions.duracaoMin}) DESC`);

  return rows.map((r) => ({
    nome: r.subjectNome,
    minutos: Number(r.totalMin),
  }));
}

// ─── Quiz performance over time ─────────────────────────────

export async function getPerformanceOverTime(planningId: string) {
  const sessions = await db
    .select({
      id: quizSessions.id,
      acertos: quizSessions.acertos,
      totalQuestoes: quizSessions.totalQuestoes,
      completedAt: quizSessions.completedAt,
    })
    .from(quizSessions)
    .where(
      and(
        eq(quizSessions.planningId, planningId),
        sql`${quizSessions.completedAt} IS NOT NULL`
      )
    )
    .orderBy(sql`${quizSessions.completedAt} ASC`);

  return sessions.map((s, i) => ({
    index: i + 1,
    data: s.completedAt
      ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(s.completedAt))
      : "",
    acerto: s.totalQuestoes > 0 ? Math.round((s.acertos / s.totalQuestoes) * 100) : 0,
  }));
}

// ─── Weak areas (topics with worst quiz performance) ────────

export async function getWeakAreas(planningId: string) {
  const rows = await db
    .select({
      topicId: quizQuestions.topicId,
      subjectNome: subjects.nome,
      topicNome: sql<string>`(SELECT nome FROM topics WHERE id = ${quizQuestions.topicId})`,
      total: sql<number>`COUNT(*)`,
      correct: sql<number>`SUM(${quizAnswers.correto})`,
    })
    .from(quizAnswers)
    .innerJoin(quizQuestions, eq(quizAnswers.questionId, quizQuestions.id))
    .innerJoin(subjects, eq(quizQuestions.subjectId, subjects.id))
    .innerJoin(quizSessions, eq(quizAnswers.quizSessionId, quizSessions.id))
    .where(eq(quizSessions.planningId, planningId))
    .groupBy(quizQuestions.topicId, subjects.nome)
    .having(sql`COUNT(*) >= 2`)
    .orderBy(sql`(SUM(${quizAnswers.correto})::float / COUNT(*)) ASC`)
    .limit(5);

  return rows.map((r) => ({
    topicNome: r.topicNome,
    subjectNome: r.subjectNome,
    total: Number(r.total),
    correct: Number(r.correct),
    pct: Number(r.total) > 0 ? Math.round((Number(r.correct) / Number(r.total)) * 100) : 0,
  }));
}

// ─── Study sessions per day (for streak calculation) ────────

export async function getStudyDays(planningId: string): Promise<string[]> {
  const rows = await db
    .select({ data: plannedSessions.data })
    .from(plannedSessions)
    .where(
      and(
        eq(plannedSessions.planningId, planningId),
        eq(plannedSessions.status, "concluida")
      )
    )
    .groupBy(plannedSessions.data)
    .orderBy(sql`${plannedSessions.data} DESC`);

  return rows.map((r) => r.data);
}
