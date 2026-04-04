import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("🌱 Iniciando seed...");

  // 1. Criar Planning
  const [planning] = await db
    .insert(schema.plannings)
    .values({
      nome: "Concurso TJ-SP 2026",
      descricao: "Preparação para o concurso do Tribunal de Justiça de São Paulo",
    })
    .returning();

  console.log(`✅ Planning criado: ${planning.nome}`);

  // 2. Criar Subjects (Matérias)
  const subjectsData = [
    { planningId: planning.id, nome: "Direito Constitucional", prioridade: "alta" as const, peso: 9 },
    { planningId: planning.id, nome: "Direito Administrativo", prioridade: "alta" as const, peso: 8 },
    { planningId: planning.id, nome: "Direito Civil", prioridade: "media" as const, peso: 7 },
    { planningId: planning.id, nome: "Direito Penal", prioridade: "media" as const, peso: 6 },
    { planningId: planning.id, nome: "Direito Processual Civil", prioridade: "alta" as const, peso: 8 },
    { planningId: planning.id, nome: "Português Jurídico", prioridade: "baixa" as const, peso: 4 },
  ];

  const insertedSubjects = await db.insert(schema.subjects).values(subjectsData).returning();
  console.log(`✅ ${insertedSubjects.length} matérias criadas`);

  // 3. Criar Topics (Subtópicos)
  const topicsMap: Record<string, Array<{ nome: string; tempoEstimadoMin: number; dificuldade: "baixa" | "media" | "alta" }>> = {
    "Direito Constitucional": [
      { nome: "Princípios Fundamentais", tempoEstimadoMin: 45, dificuldade: "media" },
      { nome: "Direitos e Garantias Fundamentais", tempoEstimadoMin: 60, dificuldade: "alta" },
      { nome: "Organização do Estado", tempoEstimadoMin: 50, dificuldade: "alta" },
      { nome: "Poder Legislativo", tempoEstimadoMin: 40, dificuldade: "media" },
      { nome: "Controle de Constitucionalidade", tempoEstimadoMin: 55, dificuldade: "alta" },
    ],
    "Direito Administrativo": [
      { nome: "Princípios da Administração Pública", tempoEstimadoMin: 40, dificuldade: "media" },
      { nome: "Atos Administrativos", tempoEstimadoMin: 50, dificuldade: "alta" },
      { nome: "Licitações e Contratos", tempoEstimadoMin: 60, dificuldade: "alta" },
      { nome: "Servidores Públicos", tempoEstimadoMin: 45, dificuldade: "media" },
    ],
    "Direito Civil": [
      { nome: "Parte Geral — Pessoas", tempoEstimadoMin: 40, dificuldade: "media" },
      { nome: "Obrigações", tempoEstimadoMin: 50, dificuldade: "alta" },
      { nome: "Contratos", tempoEstimadoMin: 55, dificuldade: "alta" },
      { nome: "Direitos Reais", tempoEstimadoMin: 45, dificuldade: "media" },
    ],
    "Direito Penal": [
      { nome: "Teoria do Crime", tempoEstimadoMin: 50, dificuldade: "alta" },
      { nome: "Crimes contra a Pessoa", tempoEstimadoMin: 40, dificuldade: "media" },
      { nome: "Crimes contra o Patrimônio", tempoEstimadoMin: 35, dificuldade: "media" },
    ],
    "Direito Processual Civil": [
      { nome: "Processo de Conhecimento", tempoEstimadoMin: 55, dificuldade: "alta" },
      { nome: "Recursos", tempoEstimadoMin: 50, dificuldade: "alta" },
      { nome: "Execução", tempoEstimadoMin: 45, dificuldade: "media" },
      { nome: "Tutela Provisória", tempoEstimadoMin: 40, dificuldade: "media" },
    ],
    "Português Jurídico": [
      { nome: "Interpretação de Texto", tempoEstimadoMin: 30, dificuldade: "baixa" },
      { nome: "Concordância e Regência", tempoEstimadoMin: 35, dificuldade: "media" },
      { nome: "Redação Oficial", tempoEstimadoMin: 25, dificuldade: "baixa" },
    ],
  };

  let topicCount = 0;
  for (const subject of insertedSubjects) {
    const topicsForSubject = topicsMap[subject.nome];
    if (topicsForSubject) {
      const topicsData = topicsForSubject.map((t) => ({
        subjectId: subject.id,
        ...t,
      }));
      await db.insert(schema.topics).values(topicsData);
      topicCount += topicsData.length;
    }
  }
  console.log(`✅ ${topicCount} subtópicos criados`);

  // 4. Criar Weekly Availability
  await db.insert(schema.weeklyAvailabilities).values({
    planningId: planning.id,
    segundaMin: 120,
    tercaMin: 120,
    quartaMin: 120,
    quintaMin: 120,
    sextaMin: 90,
    sabadoMin: 180,
    domingoMin: 60,
  });
  console.log("✅ Disponibilidade semanal configurada");

  console.log("\n🎉 Seed concluído com sucesso!");
  await client.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
