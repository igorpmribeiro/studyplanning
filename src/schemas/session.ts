import { z } from "zod";

export const generateScheduleSchema = z.object({
  planningId: z.string().uuid(),
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato deve ser YYYY-MM-DD"),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});
