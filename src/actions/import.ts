"use server";

import { db } from "@/db";
import { subjects, topics } from "@/db/schema";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

interface ImportResult {
  materias: number;
  subtopicos: number;
  details: string[];
}

export async function importFromSpreadsheet(
  planningId: string,
  formData: FormData
): Promise<ActionResult<ImportResult>> {
  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    return { success: false, error: "Nenhum arquivo selecionado." };
  }

  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    return { success: false, error: "Formato inválido. Envie um arquivo .xlsx ou .xls." };
  }

  try {
    // Dynamic import to avoid bundling xlsx (~900KB) in every page
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    let totalMaterias = 0;
    let totalSubtopicos = 0;
    const details: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

      // Find the header row containing "ASSUNTO"
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(rows.length, 5); i++) {
        const row = rows[i];
        if (
          row &&
          row[0] &&
          typeof row[0] === "string" &&
          row[0].trim().toUpperCase().startsWith("ASSUNTO")
        ) {
          headerRowIndex = i;
          break;
        }
      }

      // Extract subtopic names from column A after the header
      const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
      const subtopicNames: string[] = [];

      for (let i = startRow; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[0] && typeof row[0] === "string") {
          const name = row[0].trim();
          if (name.length > 0 && !name.toUpperCase().startsWith("ASSUNTO")) {
            subtopicNames.push(name);
          }
        }
      }

      if (subtopicNames.length === 0) continue;

      // Create the subject (matéria)
      const [subject] = await db
        .insert(subjects)
        .values({
          planningId,
          nome: sheetName.trim(),
          prioridade: "media",
          peso: 6,
          observacoes: `Importado da planilha "${file.name}"`,
        })
        .returning();

      totalMaterias++;

      // Create all subtopics with default values, preserving import order
      const topicValues = subtopicNames.map((nome, index) => ({
        subjectId: subject.id,
        nome,
        tempoEstimadoMin: 60,
        dificuldade: "media" as const,
        status: "nao_iniciado" as const,
        ordem: index,
        observacoes: "",
      }));

      await db.insert(topics).values(topicValues);
      totalSubtopicos += topicValues.length;

      details.push(`${sheetName}: ${topicValues.length} subtópicos`);
    }

    if (totalMaterias === 0) {
      return {
        success: false,
        error: "Nenhuma matéria encontrada na planilha. Verifique se cada aba tem uma coluna 'Assunto'.",
      };
    }

    revalidatePath("/materias");
    return {
      success: true,
      data: {
        materias: totalMaterias,
        subtopicos: totalSubtopicos,
        details,
      },
    };
  } catch (err) {
    console.error("Erro ao importar planilha:", err);
    return { success: false, error: "Erro ao processar a planilha. Verifique o formato do arquivo." };
  }
}
