import type { z } from "zod";
import type {
  createPlanningSchema,
  updatePlanningSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createTopicSchema,
  updateTopicSchema,
  upsertAvailabilitySchema,
  generateScheduleSchema,
  createConcursoSchema,
  updateConcursoSchema,
} from "@/schemas";
import type {
  plannings,
  subjects,
  topics,
  weeklyAvailabilities,
  plannedSessions,
  concursos,
} from "@/db/schema";

// ─── Drizzle inferred types (row types) ─────────────────────

export type Planning = typeof plannings.$inferSelect;
export type Concurso = typeof concursos.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type WeeklyAvailability = typeof weeklyAvailabilities.$inferSelect;
export type PlannedSession = typeof plannedSessions.$inferSelect;

// ─── Zod inferred types (input types) ───────────────────────

export type CreatePlanning = z.infer<typeof createPlanningSchema>;
export type UpdatePlanning = z.infer<typeof updatePlanningSchema>;
export type CreateSubject = z.infer<typeof createSubjectSchema>;
export type UpdateSubject = z.infer<typeof updateSubjectSchema>;
export type CreateTopic = z.infer<typeof createTopicSchema>;
export type UpdateTopic = z.infer<typeof updateTopicSchema>;
export type UpsertAvailability = z.infer<typeof upsertAvailabilitySchema>;
export type GenerateSchedule = z.infer<typeof generateScheduleSchema>;
export type CreateConcurso = z.infer<typeof createConcursoSchema>;
export type UpdateConcurso = z.infer<typeof updateConcursoSchema>;

// ─── Composite types ────────────────────────────────────────

export type SubjectWithTopics = Subject & {
  topics: Topic[];
};

export type ConcursoWithSubjects = Concurso & {
  subjects: SubjectWithTopics[];
};

export type SessionWithDetails = PlannedSession & {
  subject: Subject;
  topic: Topic;
};

// ─── API response types ─────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
