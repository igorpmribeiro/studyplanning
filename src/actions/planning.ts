"use server";

import { db } from "@/db";
import { plannings } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ActionResult, Planning } from "@/types";

export async function getPlanning(): Promise<Planning | null> {
  const results = await db.select().from(plannings).limit(1);
  return results[0] ?? null;
}

export async function getOrCreatePlanning(): Promise<Planning> {
  const existing = await getPlanning();
  if (existing) return existing;

  const [created] = await db
    .insert(plannings)
    .values({ nome: "Meu Planejamento", descricao: "" })
    .returning();
  return created;
}

export async function updatePlanning(
  id: string,
  data: { nome?: string; descricao?: string }
): Promise<ActionResult<Planning>> {
  const [updated] = await db
    .update(plannings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(plannings.id, id))
    .returning();

  if (!updated) return { success: false, error: "Planejamento não encontrado" };
  return { success: true, data: updated };
}
