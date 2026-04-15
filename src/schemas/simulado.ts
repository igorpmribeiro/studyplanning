import { z } from "zod";

// ─── Quiz config (start a new quiz) ────────────────────────

export const startQuizSchema = z.object({
  planningId: z.string().uuid(),
  banca: z.enum(["cespe", "fcc", "fgv", "vunesp", "generica"]),
  modo: z.enum(["por_materia", "por_topico", "misto", "revisao"]),
  subjectIds: z.array(z.string().uuid()).optional(),
  topicIds: z.array(z.string().uuid()).optional(),
  totalQuestoes: z.coerce.number().int().min(5).max(50).default(10),
});

// ─── Answer submission ──────────────────────────────────────

export const submitAnswerSchema = z.object({
  quizSessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  respostaUsuario: z.string().min(1),
});

// ─── AI question generation output ─────────────────────────

export const aiQuestionSchema = z.object({
  questions: z.array(
    z.object({
      enunciado: z.string().describe(
        "O texto da questão em português, no estilo da banca especificada"
      ),
      alternativas: z
        .array(z.string())
        .optional()
        .describe(
          "Array de 5 alternativas para múltipla escolha (A-E), omitir para certo/errado"
        ),
      respostaCorreta: z.string().describe(
        "'certo' ou 'errado' para CESPE, ou 'a','b','c','d','e' para múltipla escolha"
      ),
      explicacao: z.string().describe(
        "Explicação breve em português do porquê a resposta está correta, citando lei/doutrina relevante"
      ),
    })
  ),
});
