"use server";

import { generateText, Output } from "ai";
import { model } from "@/lib/ai";
import { aiQuestionSchema } from "@/schemas/simulado";
import { BANCA_FORMATS } from "@/lib/constants";

type GenerateParams = {
  topicNome: string;
  subjectNome: string;
  banca: keyof typeof BANCA_FORMATS;
  count: number;
  dificuldade: string;
};

const BANCA_PROMPTS: Record<string, string> = {
  cespe: `Gere {count} afirmativas no estilo CESPE/CEBRASPE sobre "{topic}" ({subject}).
Cada afirmativa deve ser uma sentença declarativa única que é inteiramente CORRETA ou contém um ERRO sutil, típico de provas CESPE.
O campo respostaCorreta deve ser "certo" ou "errado".
NÃO inclua o campo alternativas (omita-o).
Foco: texto literal de lei, conceitos doutrinários, jurisprudência do STF/STJ.
Dificuldade: {dificuldade}.`,

  fcc: `Gere {count} questões de múltipla escolha (A-E) no estilo FCC sobre "{topic}" ({subject}).
Estilo FCC: direto, objetivo, testa conhecimento de texto literal de lei e regras procedimentais.
O campo alternativas deve conter exatamente 5 strings (as alternativas A a E).
O campo respostaCorreta deve ser "a", "b", "c", "d" ou "e".
Uma resposta correta, quatro distratores plausíveis.
Dificuldade: {dificuldade}.`,

  fgv: `Gere {count} questões de múltipla escolha (A-E) no estilo FGV sobre "{topic}" ({subject}).
Estilo FGV: mais interpretativo, pode incluir cenários práticos/casos concretos, testa aplicação de princípios jurídicos.
O campo alternativas deve conter exatamente 5 strings (as alternativas A a E).
O campo respostaCorreta deve ser "a", "b", "c", "d" ou "e".
Uma resposta correta, quatro distratores plausíveis.
Dificuldade: {dificuldade}.`,

  vunesp: `Gere {count} questões de múltipla escolha (A-E) no estilo VUNESP sobre "{topic}" ({subject}).
Estilo VUNESP: misto entre texto literal e interpretação, com linguagem clara e direta.
O campo alternativas deve conter exatamente 5 strings (as alternativas A a E).
O campo respostaCorreta deve ser "a", "b", "c", "d" ou "e".
Uma resposta correta, quatro distratores plausíveis.
Dificuldade: {dificuldade}.`,

  generica: `Gere {count} questões de múltipla escolha (A-E) sobre "{topic}" ({subject}).
Estilo genérico de concurso público brasileiro, cobrindo lei seca, doutrina e jurisprudência.
O campo alternativas deve conter exatamente 5 strings (as alternativas A a E).
O campo respostaCorreta deve ser "a", "b", "c", "d" ou "e".
Uma resposta correta, quatro distratores plausíveis.
Dificuldade: {dificuldade}.`,
};

const DIFICULDADE_MAP: Record<string, string> = {
  baixa: "Fácil - questões diretas que testam conhecimento básico",
  media: "Média - questões que exigem compreensão e alguma análise",
  alta: "Difícil - questões que exigem domínio profundo e análise crítica",
};

export async function generateQuestionsForTopic({
  topicNome,
  subjectNome,
  banca,
  count,
  dificuldade,
}: GenerateParams) {
  const promptTemplate = BANCA_PROMPTS[banca] ?? BANCA_PROMPTS.generica;
  const userPrompt = promptTemplate
    .replace("{count}", String(count))
    .replace("{topic}", topicNome)
    .replace("{subject}", subjectNome)
    .replace("{dificuldade}", DIFICULDADE_MAP[dificuldade] ?? DIFICULDADE_MAP.media);

  const { output } = await generateText({
    model,
    output: Output.object({ schema: aiQuestionSchema }),
    system: `Você é um especialista em elaboração de questões para concursos públicos brasileiros na área de Direito.
Gere questões realistas, precisas e bem fundamentadas. Cada questão deve ter uma explicação clara citando a fonte jurídica (artigo de lei, súmula, ou doutrina).
Responda SEMPRE em português brasileiro.`,
    prompt: userPrompt,
  });

  if (!output) {
    throw new Error("Falha ao gerar questões: resposta vazia da IA");
  }

  return output.questions;
}
