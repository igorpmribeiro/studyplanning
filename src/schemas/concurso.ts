import { z } from "zod";

export const createConcursoSchema = z.object({
  planningId: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  dataProva: z.string().optional().default(""),
});

export const updateConcursoSchema = createConcursoSchema.omit({ planningId: true }).partial();
