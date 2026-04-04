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

// ─── Plannings ──────────────────────────────────────────────

export const plannings = pgTable("plannings", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  descricao: text("descricao").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const planningsRelations = relations(plannings, ({ many }) => ({
  subjects: many(subjects),
  weeklyAvailabilities: many(weeklyAvailabilities),
  plannedSessions: many(plannedSessions),
}));

// ─── Subjects (Matérias) ────────────────────────────────────

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  planningId: uuid("planning_id")
    .notNull()
    .references(() => plannings.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
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
  topics: many(topics),
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
  observacoes: text("observacoes").default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const topicsRelations = relations(topics, ({ one }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
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
