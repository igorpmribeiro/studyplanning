ALTER TABLE "topics" ADD COLUMN "study_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "revisao1_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "revisao2_completed_at" timestamp with time zone;--> statement-breakpoint

-- Backfill from existing completed sessions
UPDATE "topics"
SET "study_completed_at" = subq.completed_at
FROM (
  SELECT "topic_id", MAX("updated_at") AS completed_at
  FROM "planned_sessions"
  WHERE "tipo_sessao" = 'estudo' AND "status" = 'concluida'
  GROUP BY "topic_id"
) AS subq
WHERE "topics"."id" = subq."topic_id";--> statement-breakpoint

UPDATE "topics"
SET "revisao1_completed_at" = subq.completed_at
FROM (
  SELECT "topic_id", MAX("updated_at") AS completed_at
  FROM "planned_sessions"
  WHERE "tipo_sessao" = 'revisao_1' AND "status" = 'concluida'
  GROUP BY "topic_id"
) AS subq
WHERE "topics"."id" = subq."topic_id";--> statement-breakpoint

UPDATE "topics"
SET "revisao2_completed_at" = subq.completed_at
FROM (
  SELECT "topic_id", MAX("updated_at") AS completed_at
  FROM "planned_sessions"
  WHERE "tipo_sessao" = 'revisao_2' AND "status" = 'concluida'
  GROUP BY "topic_id"
) AS subq
WHERE "topics"."id" = subq."topic_id";
