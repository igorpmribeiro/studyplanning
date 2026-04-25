import { pgTable, pgEnum, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// PostgreSQL enums
export const prioridadeEnum = pgEnum("prioridade", ["baixa", "media", "alta"]);
export const dificuldadeEnum = pgEnum("dificuldade", ["baixa", "media", "alta"]);
export const topicStatusEnum = pgEnum("topic_status", [
  "nao_iniciado",
  "em_andamento",
  "revisando",
  "concluido",
]);
export const tipoSessaoEnum = pgEnum("tipo_sessao", ["estudo", "revisao_1", "revisao_2"]);
export const sessionStatusEnum = pgEnum("session_status", ["pendente", "concluida"]);
export const bancaEnum = pgEnum("banca", ["cespe", "fcc", "fgv", "vunesp", "generica"]);
export const questionFormatEnum = pgEnum("question_format", ["certo_errado", "multipla_escolha"]);
export const quizModeEnum = pgEnum("quiz_mode", ["por_materia", "por_topico", "misto", "revisao"]);

// ─── Concursos ──────────────────────────────────────────────

export const concursos = pgTable("concursos", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  dataProva: text("data_prova"), // ISO date YYYY-MM-DD, nullable
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const concursosRelations = relations(concursos, ({ one, many }) => ({
  planning: one(plannings, {
    fields: [concursos.planningId],
    references: [plannings.id],
  }),
  subjects: many(subjects),
}));

// ─── Plannings ──────────────────────────────────────────────

export const plannings = pgTable("plannings", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  descricao: text("descricao").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planningsRelations = relations(plannings, ({ many }) => ({
  concursos: many(concursos),
  subjects: many(subjects),
  weeklyAvailabilities: many(weeklyAvailabilities),
  plannedSessions: many(plannedSessions),
  quizSessions: many(quizSessions),
}));

// ─── Subjects (Matérias) ────────────────────────────────────

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  concursoId: uuid("concurso_id").references(() => concursos.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  cor: text("cor").notNull().default("blue"),
  prioridade: prioridadeEnum("prioridade").notNull().default("media"),
  peso: integer("peso").notNull().default(5),
  observacoes: text("observacoes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  planning: one(plannings, {
    fields: [subjects.planningId],
    references: [plannings.id],
  }),
  concurso: one(concursos, {
    fields: [subjects.concursoId],
    references: [concursos.id],
  }),
  topics: many(topics),
  quizQuestions: many(quizQuestions),
}));

// ─── Topics (Subtópicos) ────────────────────────────────────

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  tempoEstimadoMin: integer("tempo_estimado_min").notNull().default(30),
  dificuldade: dificuldadeEnum("dificuldade").notNull().default("media"),
  status: topicStatusEnum("status").notNull().default("nao_iniciado"),
  ordem: integer("ordem").notNull().default(0),
  observacoes: text("observacoes").default(""),
  studyCompletedAt: timestamp("study_completed_at", { withTimezone: true }),
  revisao1CompletedAt: timestamp("revisao1_completed_at", { withTimezone: true }),
  revisao2CompletedAt: timestamp("revisao2_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  quizQuestions: many(quizQuestions),
}));

// ─── Weekly Availabilities ──────────────────────────────────

export const weeklyAvailabilities = pgTable("weekly_availabilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  segundaMin: integer("segunda_min").notNull().default(0),
  tercaMin: integer("terca_min").notNull().default(0),
  quartaMin: integer("quarta_min").notNull().default(0),
  quintaMin: integer("quinta_min").notNull().default(0),
  sextaMin: integer("sexta_min").notNull().default(0),
  sabadoMin: integer("sabado_min").notNull().default(0),
  domingoMin: integer("domingo_min").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weeklyAvailabilitiesRelations = relations(weeklyAvailabilities, ({ one }) => ({
  planning: one(plannings, {
    fields: [weeklyAvailabilities.planningId],
    references: [plannings.id],
  }),
}));

// ─── Planned Sessions ───────────────────────────────────────

export const plannedSessions = pgTable("planned_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  data: text("data").notNull(), // ISO date YYYY-MM-DD
  diaSemana: integer("dia_semana").notNull(), // 0=segunda ... 6=domingo
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id),
  tipoSessao: tipoSessaoEnum("tipo_sessao").notNull(),
  duracaoMin: integer("duracao_min").notNull(),
  ordemNoDia: integer("ordem_no_dia").notNull(),
  status: sessionStatusEnum("status").notNull().default("pendente"),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const plannedSessionsRelations = relations(plannedSessions, ({ one }) => ({
  planning: one(plannings, {
    fields: [plannedSessions.planningId],
    references: [plannings.id],
  }),
  subject: one(subjects, {
    fields: [plannedSessions.subjectId],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [plannedSessions.topicId],
    references: [topics.id],
  }),
}));

// ─── Quiz Questions (cache de questões geradas por IA) ─────

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  banca: bancaEnum("banca").notNull(),
  formato: questionFormatEnum("formato").notNull(),
  dificuldade: dificuldadeEnum("dificuldade").notNull(),
  enunciado: text("enunciado").notNull(),
  alternativas: text("alternativas"), // JSON string[] para múltipla escolha, null para certo/errado
  respostaCorreta: text("resposta_correta").notNull(),
  explicacao: text("explicacao").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizQuestionsRelations = relations(quizQuestions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [quizQuestions.topicId],
    references: [topics.id],
  }),
  subject: one(subjects, {
    fields: [quizQuestions.subjectId],
    references: [subjects.id],
  }),
  answers: many(quizAnswers),
}));

// ─── Quiz Sessions (tentativas de simulado) ────────────────

export const quizSessions = pgTable("quiz_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  banca: bancaEnum("banca").notNull(),
  modo: quizModeEnum("modo").notNull(),
  totalQuestoes: integer("total_questoes").notNull(),
  acertos: integer("acertos").notNull().default(0),
  erros: integer("erros").notNull().default(0),
  tempoSegundos: integer("tempo_segundos"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizSessionsRelations = relations(quizSessions, ({ one, many }) => ({
  planning: one(plannings, {
    fields: [quizSessions.planningId],
    references: [plannings.id],
  }),
  answers: many(quizAnswers),
  filters: many(quizSessionFilters),
}));

// ─── Quiz Answers (respostas individuais) ───────────────────

export const quizAnswers = pgTable("quiz_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizSessionId: uuid("quiz_session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => quizQuestions.id, { onDelete: "cascade" }),
  respostaUsuario: text("resposta_usuario").notNull(),
  correto: integer("correto").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quizAnswersRelations = relations(quizAnswers, ({ one }) => ({
  quizSession: one(quizSessions, {
    fields: [quizAnswers.quizSessionId],
    references: [quizSessions.id],
  }),
  question: one(quizQuestions, {
    fields: [quizAnswers.questionId],
    references: [quizQuestions.id],
  }),
}));

// ─── Quiz Session Filters (matérias/tópicos filtrados) ──────

export const quizSessionFilters = pgTable("quiz_session_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizSessionId: uuid("quiz_session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  topicId: uuid("topic_id").references(() => topics.id, { onDelete: "set null" }),
});

export const quizSessionFiltersRelations = relations(quizSessionFilters, ({ one }) => ({
  quizSession: one(quizSessions, {
    fields: [quizSessionFilters.quizSessionId],
    references: [quizSessions.id],
  }),
  subject: one(subjects, {
    fields: [quizSessionFilters.subjectId],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [quizSessionFilters.topicId],
    references: [topics.id],
  }),
}));
