import { z } from "zod";

export const createSubjectSchema = z.object({
  planningId: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
  peso: z.coerce.number().int().min(1, "Peso mínimo é 1").max(10, "Peso máximo é 10").default(5),
  observacoes: z.string().max(1000).optional().default(""),
});

export const updateSubjectSchema = createSubjectSchema.omit({ planningId: true }).partial();
