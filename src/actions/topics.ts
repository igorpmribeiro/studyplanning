"use server";

import { db } from "@/db";
import { topics } from "@/db/schema";
import { createTopicSchema, updateTopicSchema } from "@/schemas/topic";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult, Topic } from "@/types";

export async function createTopic(formData: FormData): Promise<ActionResult<Topic>> {
  const raw = Object.fromEntries(formData);
  const parsed = createTopicSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [topic] = await db.insert(topics).values(parsed.data).returning();
  revalidatePath(`/materias/${parsed.data.subjectId}`);
  revalidatePath("/materias");
  return { success: true, data: topic };
}

export async function updateTopic(
  id: string,
  formData: FormData
): Promise<ActionResult<Topic>> {
  const raw = Object.fromEntries(formData);
  const parsed = updateTopicSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const [updated] = await db
    .update(topics)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(topics.id, id))
    .returning();

  if (!updated) return { success: false, error: "Subtópico não encontrado" };

  revalidatePath("/materias");
  return { success: true, data: updated };
}

export async function deleteTopic(id: string): Promise<ActionResult> {
  const deleted = await db.delete(topics).where(eq(topics.id, id)).returning();

  if (deleted.length === 0) return { success: false, error: "Subtópico não encontrado" };

  revalidatePath("/materias");
  return { success: true, data: undefined };
}
