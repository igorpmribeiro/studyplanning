import { z } from "zod";

const minutesField = z.coerce
  .number()
  .int()
  .min(0, "Não pode ser negativo")
  .max(1440, "Máximo 24 horas por dia");

export const upsertAvailabilitySchema = z.object({
  planningId: z.string().uuid(),
  segundaMin: minutesField.default(0),
  tercaMin: minutesField.default(0),
  quartaMin: minutesField.default(0),
  quintaMin: minutesField.default(0),
  sextaMin: minutesField.default(0),
  sabadoMin: minutesField.default(0),
  domingoMin: minutesField.default(0),
});
