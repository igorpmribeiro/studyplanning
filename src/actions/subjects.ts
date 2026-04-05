"use server";

import { db } from "@/db";
import { subjects, topics } from "@/db/schema";
import { createSubjectSchema, updateSubjectSchema } from "@/schemas/subject";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult, Subject, SubjectWithTopics } from "@/types";

export async function getSubjects(planningId: string): Promise<SubjectWithTopics[]> {
  const results = await db.query.subjects.findMany({
    where: eq(subjects.planningId, planningId),
    with: { topics: { orderBy: [asc(topics.ordem), asc(topics.createdAt)] } },
    orderBy: [asc(subjects.nome)],
  });
  return results;
}

export async function getSubjectById(id: string): Promise<SubjectWithTopics | null> {
  const result = await db.query.subjects.findFirst({
    where: eq(subjects.id, id),
    with: { topics: { orderBy: [asc(topics.ordem), asc(topics.createdAt)] } },
  });
  return result ?? null;
}

export async function createSubject(formData: FormData): Promise<ActionResult<Subject>> {
  const raw = Object.fromEntries(formData);
  const parsed = createSubjectSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [subject] = await db.insert(subjects).values(parsed.data).returning();
  revalidatePath("/materias");
  return { success: true, data: subject };
}

export async function updateSubject(
  id: string,
  formData: FormData
): Promise<ActionResult<Subject>> {
  const raw = Object.fromEntries(formData);
  const parsed = updateSubjectSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [updated] = await db
    .update(subjects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(subjects.id, id))
    .returning();

  if (!updated) return { success: false, error: "Matéria não encontrada" };

  revalidatePath("/materias");
  revalidatePath(`/materias/${id}`);
  return { success: true, data: updated };
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const deleted = await db.delete(subjects).where(eq(subjects.id, id)).returning();

  if (deleted.length === 0) return { success: false, error: "Matéria não encontrada" };

  revalidatePath("/materias");
  return { success: true, data: undefined };
}
