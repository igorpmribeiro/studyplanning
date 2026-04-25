import { z } from "zod";
import { SUBJECT_COLOR_KEYS } from "@/lib/constants";

const subjectColorSchema = z
  .enum(SUBJECT_COLOR_KEYS as [string, ...string[]])
  .default("blue");

export const createSubjectSchema = z.object({
  planningId: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  cor: subjectColorSchema,
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
  peso: z.coerce.number().int().min(1, "Peso mínimo é 1").max(10, "Peso máximo é 10").default(5),
  observacoes: z.string().max(1000).optional().default(""),
});

export const updateSubjectSchema = createSubjectSchema.omit({ planningId: true }).partial();
