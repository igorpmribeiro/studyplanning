ALTER TABLE "subjects" ADD COLUMN "cor" text DEFAULT 'blue' NOT NULL;--> statement-breakpoint

-- Distribute palette colors across existing subjects based on creation order
-- so the cronograma already shows different colors instead of all blue.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at", id) - 1 AS rn FROM "subjects"
)
UPDATE "subjects" s
SET "cor" = (ARRAY[
  'blue', 'emerald', 'amber', 'rose', 'violet', 'cyan',
  'orange', 'pink', 'lime', 'teal', 'fuchsia', 'sky'
])[(o.rn % 12) + 1]
FROM ordered o
WHERE s.id = o.id;
