"use server";

import { db } from "@/db";
import { concursos, subjects } from "@/db/schema";
import { createConcursoSchema, updateConcursoSchema } from "@/schemas/concurso";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult, Concurso, ConcursoWithSubjects } from "@/types";

export async function getConcursos(planningId: string): Promise<ConcursoWithSubjects[]> {
  return db.query.concursos.findMany({
    where: eq(concursos.planningId, planningId),
    with: {
      subjects: {
        with: { topics: true },
        orderBy: [asc(subjects.nome)],
      },
    },
    orderBy: [asc(concursos.dataProva), asc(concursos.nome)],
  });
}

export async function createConcurso(formData: FormData): Promise<ActionResult<Concurso>> {
  const raw = Object.fromEntries(formData);
  const parsed = createConcursoSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados invalidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [concurso] = await db.insert(concursos).values(parsed.data).returning();
  revalidatePath("/concursos");
  return { success: true, data: concurso };
}

export async function updateConcurso(
  id: string,
  formData: FormData
): Promise<ActionResult<Concurso>> {
  const raw = Object.fromEntries(formData);
  const parsed = updateConcursoSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados invalidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [updated] = await db
    .update(concursos)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(concursos.id, id))
    .returning();

  if (!updated) return { success: false, error: "Concurso nao encontrado" };

  revalidatePath("/concursos");
  return { success: true, data: updated };
}

export async function deleteConcurso(id: string): Promise<ActionResult> {
  // Unlink subjects before deleting (onDelete: set null handles this via FK)
  const deleted = await db.delete(concursos).where(eq(concursos.id, id)).returning();

  if (deleted.length === 0) return { success: false, error: "Concurso nao encontrado" };

  revalidatePath("/concursos");
  revalidatePath("/materias");
  return { success: true, data: undefined };
}

export async function linkSubjectToConcurso(
  subjectId: string,
  concursoId: string | null
): Promise<ActionResult> {
  await db
    .update(subjects)
    .set({ concursoId, updatedAt: new Date() })
    .where(eq(subjects.id, subjectId));

  revalidatePath("/concursos");
  revalidatePath("/materias");
  return { success: true, data: undefined };
}
