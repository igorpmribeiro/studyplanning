"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  quizQuestions,
  quizSessions,
  quizAnswers,
  quizSessionFilters,
  subjects,
  topics,
} from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { startQuizSchema, submitAnswerSchema } from "@/schemas/simulado";
import { BANCA_FORMATS } from "@/lib/constants";
import { generateQuestionsForTopic } from "@/actions/ai";
import type { ActionResult, QuizSessionWithDetails, QuizStats } from "@/types";

// ─── Start a quiz session ───────────────────────────────────

export async function startQuizSession(data: {
  planningId: string;
  banca: string;
  modo: string;
  subjectIds?: string[];
  topicIds?: string[];
  totalQuestoes: number;
}) {
  const parsed = startQuizSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false as const, error: "Dados inválidos", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { planningId, banca, modo, subjectIds, topicIds, totalQuestoes } = parsed.data;

  // Resolve topics based on mode
  let targetTopics: { id: string; nome: string; subjectId: string; subjectNome: string; dificuldade: string }[] = [];

  if (modo === "por_topico" && topicIds?.length) {
    const rows = await db
      .select({
        id: topics.id,
        nome: topics.nome,
        subjectId: topics.subjectId,
        subjectNome: subjects.nome,
        dificuldade: topics.dificuldade,
      })
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(inArray(topics.id, topicIds));
    targetTopics = rows;
  } else if (modo === "por_materia" && subjectIds?.length) {
    const rows = await db
      .select({
        id: topics.id,
        nome: topics.nome,
        subjectId: topics.subjectId,
        subjectNome: subjects.nome,
        dificuldade: topics.dificuldade,
      })
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(inArray(subjects.id, subjectIds));
    targetTopics = rows;
  } else if (modo === "revisao") {
    const rows = await db
      .select({
        id: topics.id,
        nome: topics.nome,
        subjectId: topics.subjectId,
        subjectNome: subjects.nome,
        dificuldade: topics.dificuldade,
      })
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(
        and(eq(subjects.planningId, planningId), eq(topics.status, "revisando"))
      );
    targetTopics = rows;
  } else {
    // misto: all topics from planning
    const rows = await db
      .select({
        id: topics.id,
        nome: topics.nome,
        subjectId: topics.subjectId,
        subjectNome: subjects.nome,
        dificuldade: topics.dificuldade,
      })
      .from(topics)
      .innerJoin(subjects, eq(topics.subjectId, subjects.id))
      .where(eq(subjects.planningId, planningId));
    targetTopics = rows;
  }

  if (targetTopics.length === 0) {
    return { success: false as const, error: "Nenhum tópico encontrado para os filtros selecionados." };
  }

  // Limit topics to avoid too many AI calls — pick a diverse subset
  // Shuffle and take at most enough topics to fill the quiz
  const maxTopics = Math.min(targetTopics.length, Math.max(3, Math.ceil(totalQuestoes / 2)));
  const shuffledTopics = [...targetTopics].sort(() => Math.random() - 0.5).slice(0, maxTopics);

  // Distribute questions across selected topics
  const questionsPerTopic = Math.max(1, Math.ceil(totalQuestoes / shuffledTopics.length));
  const formato = BANCA_FORMATS[banca as keyof typeof BANCA_FORMATS] ?? "multipla_escolha";

  let allQuestions: typeof quizQuestions.$inferSelect[] = [];

  // Generate in parallel (up to 3 concurrent) for speed
  const generateForTopic = async (topic: typeof shuffledTopics[0]) => {
    const needed = Math.min(questionsPerTopic, totalQuestoes);

    // Check cache first
    const cached = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          eq(quizQuestions.topicId, topic.id),
          eq(quizQuestions.banca, banca as "cespe" | "fcc" | "fgv" | "vunesp" | "generica"),
          eq(quizQuestions.dificuldade, topic.dificuldade as "baixa" | "media" | "alta")
        )
      )
      .limit(needed);

    const fromCache = cached.slice(0, needed);
    const deficit = needed - fromCache.length;

    if (deficit > 0) {
      try {
        const generated = await generateQuestionsForTopic({
          topicNome: topic.nome,
          subjectNome: topic.subjectNome,
          banca: banca as keyof typeof BANCA_FORMATS,
          count: deficit,
          dificuldade: topic.dificuldade,
        });

        const toInsert = generated.map((q) => ({
          topicId: topic.id,
          subjectId: topic.subjectId,
          banca: banca as "cespe" | "fcc" | "fgv" | "vunesp" | "generica",
          formato: formato as "certo_errado" | "multipla_escolha",
          dificuldade: topic.dificuldade as "baixa" | "media" | "alta",
          enunciado: q.enunciado,
          alternativas: q.alternativas ? JSON.stringify(q.alternativas) : null,
          respostaCorreta: q.respostaCorreta.toLowerCase(),
          explicacao: q.explicacao,
        }));

        const inserted = await db.insert(quizQuestions).values(toInsert).returning();
        return [...fromCache, ...inserted];
      } catch (err) {
        console.error(`[Simulado] Erro ao gerar questões para "${topic.nome}":`, err instanceof Error ? err.message : err);
        return fromCache;
      }
    }
    return fromCache;
  };

  // Run AI calls in parallel batches of 3
  const BATCH_SIZE = 3;
  for (let i = 0; i < shuffledTopics.length && allQuestions.length < totalQuestoes; i += BATCH_SIZE) {
    const batch = shuffledTopics.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(generateForTopic));
    for (const qs of results) {
      allQuestions.push(...qs);
    }
  }

  // Trim to exact count and shuffle
  allQuestions = allQuestions.slice(0, totalQuestoes);
  allQuestions.sort(() => Math.random() - 0.5);

  if (allQuestions.length === 0) {
    return { success: false as const, error: "Não foi possível gerar questões. Verifique se a chave da API do Google AI está configurada corretamente e tente novamente." };
  }

  // Create quiz session
  const [session] = await db
    .insert(quizSessions)
    .values({
      planningId,
      banca: banca as "cespe" | "fcc" | "fgv" | "vunesp" | "generica",
      modo: modo as "por_materia" | "por_topico" | "misto" | "revisao",
      totalQuestoes: allQuestions.length,
    })
    .returning();

  // Save filters for analytics
  const uniqueSubjects = [...new Set(targetTopics.map((t) => t.subjectId))];
  if (uniqueSubjects.length > 0) {
    await db.insert(quizSessionFilters).values(
      uniqueSubjects.map((sid) => ({
        quizSessionId: session.id,
        subjectId: sid,
      }))
    );
  }

  revalidatePath("/simulado");

  return {
    success: true as const,
    data: {
      sessionId: session.id,
      questions: allQuestions.map((q) => ({
        id: q.id,
        enunciado: q.enunciado,
        formato: q.formato,
        alternativas: q.alternativas ? JSON.parse(q.alternativas) as string[] : null,
        topicId: q.topicId,
        subjectId: q.subjectId,
      })),
    },
  };
}

// ─── Submit an answer ───────────────────────────────────────

export async function submitQuizAnswer(data: {
  quizSessionId: string;
  questionId: string;
  respostaUsuario: string;
}): Promise<ActionResult<{ correto: boolean; respostaCorreta: string; explicacao: string }>> {
  const parsed = submitAnswerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos" };
  }

  const { quizSessionId, questionId, respostaUsuario } = parsed.data;

  // Get the question
  const question = await db.query.quizQuestions.findFirst({
    where: eq(quizQuestions.id, questionId),
  });

  if (!question) {
    return { success: false, error: "Questão não encontrada" };
  }

  const isCorrect = respostaUsuario.toLowerCase() === question.respostaCorreta.toLowerCase();

  // Check if already answered (avoid duplicates)
  const existing = await db.query.quizAnswers.findFirst({
    where: and(
      eq(quizAnswers.quizSessionId, quizSessionId),
      eq(quizAnswers.questionId, questionId)
    ),
  });

  if (existing) {
    // Update existing answer
    await db
      .update(quizAnswers)
      .set({
        respostaUsuario: respostaUsuario.toLowerCase(),
        correto: isCorrect ? 1 : 0,
      })
      .where(eq(quizAnswers.id, existing.id));
  } else {
    await db.insert(quizAnswers).values({
      quizSessionId,
      questionId,
      respostaUsuario: respostaUsuario.toLowerCase(),
      correto: isCorrect ? 1 : 0,
    });
  }

  return {
    success: true,
    data: {
      correto: isCorrect,
      respostaCorreta: question.respostaCorreta,
      explicacao: question.explicacao,
    },
  };
}

// ─── Complete a quiz session ────────────────────────────────

export async function completeQuizSession(
  quizSessionId: string,
  tempoSegundos?: number
): Promise<ActionResult<{ acertos: number; erros: number; total: number }>> {
  const answers = await db
    .select()
    .from(quizAnswers)
    .where(eq(quizAnswers.quizSessionId, quizSessionId));

  const acertos = answers.filter((a) => a.correto === 1).length;
  const erros = answers.filter((a) => a.correto === 0).length;

  await db
    .update(quizSessions)
    .set({
      acertos,
      erros,
      tempoSegundos: tempoSegundos ?? null,
      completedAt: new Date(),
    })
    .where(eq(quizSessions.id, quizSessionId));

  revalidatePath("/simulado");
  revalidatePath("/");

  return {
    success: true,
    data: { acertos, erros, total: answers.length },
  };
}

// ─── Get quiz session with details ──────────────────────────

export async function getQuizSession(id: string): Promise<QuizSessionWithDetails | null> {
  const session = await db.query.quizSessions.findFirst({
    where: eq(quizSessions.id, id),
    with: {
      answers: {
        with: {
          question: true,
        },
      },
      filters: {
        with: {
          subject: true,
          topic: true,
        },
      },
    },
  });

  return session ?? null;
}

// ─── Get quiz questions for a session ────────────────────────

export async function getQuizQuestionsBySession(quizSessionId: string) {
  const session = await db.query.quizSessions.findFirst({
    where: eq(quizSessions.id, quizSessionId),
    with: {
      answers: {
        with: { question: true },
      },
    },
  });

  if (!session) return null;

  // If there are answers, return the questions from answers
  if (session.answers.length > 0) {
    return session.answers.map((a) => ({
      id: a.question.id,
      enunciado: a.question.enunciado,
      formato: a.question.formato,
      alternativas: a.question.alternativas
        ? (JSON.parse(a.question.alternativas) as string[])
        : null,
      topicId: a.question.topicId,
      subjectId: a.question.subjectId,
    }));
  }

  // Otherwise, fetch questions from the session filters
  const filters = await db.query.quizSessionFilters.findMany({
    where: eq(quizSessionFilters.quizSessionId, quizSessionId),
  });

  const subjectIds = filters.map((f) => f.subjectId).filter(Boolean) as string[];
  const topicIds = filters.map((f) => f.topicId).filter(Boolean) as string[];

  let questions;
  if (topicIds.length > 0) {
    questions = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          inArray(quizQuestions.topicId, topicIds),
          eq(quizQuestions.banca, session.banca)
        )
      )
      .limit(session.totalQuestoes);
  } else if (subjectIds.length > 0) {
    questions = await db
      .select()
      .from(quizQuestions)
      .where(
        and(
          inArray(quizQuestions.subjectId, subjectIds),
          eq(quizQuestions.banca, session.banca)
        )
      )
      .limit(session.totalQuestoes);
  } else {
    questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.banca, session.banca))
      .limit(session.totalQuestoes);
  }

  return questions.map((q) => ({
    id: q.id,
    enunciado: q.enunciado,
    formato: q.formato,
    alternativas: q.alternativas ? (JSON.parse(q.alternativas) as string[]) : null,
    topicId: q.topicId,
    subjectId: q.subjectId,
  }));
}

// ─── Get quiz history ───────────────────────────────────────

export async function getQuizHistory(planningId: string) {
  const sessions = await db
    .select()
    .from(quizSessions)
    .where(eq(quizSessions.planningId, planningId))
    .orderBy(sql`${quizSessions.createdAt} DESC`);

  return sessions;
}

// ─── Get quiz stats ─────────────────────────────────────────

export async function getQuizStats(planningId: string): Promise<QuizStats> {
  const sessions = await db.query.quizSessions.findMany({
    where: and(
      eq(quizSessions.planningId, planningId),
      sql`${quizSessions.completedAt} IS NOT NULL`
    ),
    with: {
      answers: {
        with: {
          question: true,
        },
      },
    },
  });

  const totalQuizzes = sessions.length;
  const totalQuestions = sessions.reduce((acc, s) => acc + s.answers.length, 0);
  const totalCorrect = sessions.reduce(
    (acc, s) => acc + s.answers.filter((a) => a.correto === 1).length,
    0
  );
  const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // By banca
  const byBanca: QuizStats["byBanca"] = {};
  for (const s of sessions) {
    if (!byBanca[s.banca]) byBanca[s.banca] = { total: 0, correct: 0, avg: 0 };
    byBanca[s.banca].total += s.answers.length;
    byBanca[s.banca].correct += s.answers.filter((a) => a.correto === 1).length;
  }
  for (const key of Object.keys(byBanca)) {
    byBanca[key].avg =
      byBanca[key].total > 0
        ? Math.round((byBanca[key].correct / byBanca[key].total) * 100)
        : 0;
  }

  // By subject
  const bySubject: QuizStats["bySubject"] = {};
  for (const s of sessions) {
    for (const a of s.answers) {
      const sid = a.question.subjectId;
      if (!bySubject[sid]) {
        bySubject[sid] = { nome: "", total: 0, correct: 0, avg: 0 };
      }
      bySubject[sid].total += 1;
      if (a.correto === 1) bySubject[sid].correct += 1;
    }
  }

  // Fill subject names
  const subjectIds = Object.keys(bySubject);
  if (subjectIds.length > 0) {
    const subjectRows = await db
      .select({ id: subjects.id, nome: subjects.nome })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds));
    for (const row of subjectRows) {
      if (bySubject[row.id]) bySubject[row.id].nome = row.nome;
    }
  }
  for (const key of Object.keys(bySubject)) {
    bySubject[key].avg =
      bySubject[key].total > 0
        ? Math.round((bySubject[key].correct / bySubject[key].total) * 100)
        : 0;
  }

  return { totalQuizzes, totalQuestions, totalCorrect, averageScore, byBanca, bySubject };
}
