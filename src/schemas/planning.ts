import { z } from "zod";

export const createPlanningSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().max(1000).optional().default(""),
});

export const updatePlanningSchema = createPlanningSchema.partial();
