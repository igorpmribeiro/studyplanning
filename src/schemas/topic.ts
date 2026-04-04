import { z } from "zod";

export const createTopicSchema = z.object({
  subjectId: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  tempoEstimadoMin: z.coerce
    .number()
    .int()
    .min(5, "Tempo mínimo é 5 minutos")
    .max(480, "Tempo máximo é 8 horas")
    .default(30),
  dificuldade: z.enum(["baixa", "media", "alta"]).default("media"),
  status: z.enum(["nao_iniciado", "em_andamento", "revisando", "concluido"]).default("nao_iniciado"),
  observacoes: z.string().max(1000).optional().default(""),
});

export const updateTopicSchema = createTopicSchema.omit({ subjectId: true }).partial();
