"use server";

import { db } from "@/db";
import { weeklyAvailabilities } from "@/db/schema";
import { upsertAvailabilitySchema } from "@/schemas/availability";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult, WeeklyAvailability } from "@/types";

export async function getAvailability(planningId: string): Promise<WeeklyAvailability | null> {
  const result = await db.query.weeklyAvailabilities.findFirst({
    where: eq(weeklyAvailabilities.planningId, planningId),
  });
  return result ?? null;
}

export async function upsertAvailability(formData: FormData): Promise<ActionResult<WeeklyAvailability>> {
  const raw = Object.fromEntries(formData);
  const parsed = upsertAvailabilitySchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: "Dados inválidos",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const existing = await db.query.weeklyAvailabilities.findFirst({
    where: eq(weeklyAvailabilities.planningId, parsed.data.planningId),
  });

  let result: WeeklyAvailability;

  if (existing) {
    const [updated] = await db
      .update(weeklyAvailabilities)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(weeklyAvailabilities.id, existing.id))
      .returning();
    result = updated;
  } else {
    const [created] = await db
      .insert(weeklyAvailabilities)
      .values(parsed.data)
      .returning();
    result = created;
  }

  revalidatePath("/planejamento");
  return { success: true, data: result };
}
