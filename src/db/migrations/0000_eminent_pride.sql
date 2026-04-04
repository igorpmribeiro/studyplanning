CREATE TYPE "public"."dificuldade" AS ENUM('baixa', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."prioridade" AS ENUM('baixa', 'media', 'alta');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('pendente', 'concluida');--> statement-breakpoint
CREATE TYPE "public"."tipo_sessao" AS ENUM('estudo', 'revisao_1', 'revisao_2');--> statement-breakpoint
CREATE TYPE "public"."topic_status" AS ENUM('nao_iniciado', 'em_andamento', 'revisando', 'concluido');--> statement-breakpoint
CREATE TABLE "planned_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_id" uuid NOT NULL,
	"data" text NOT NULL,
	"dia_semana" integer NOT NULL,
	"subject_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"tipo_sessao" "tipo_sessao" NOT NULL,
	"duracao_min" integer NOT NULL,
	"ordem_no_dia" integer NOT NULL,
	"status" "session_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plannings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"descricao" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"prioridade" "prioridade" DEFAULT 'media' NOT NULL,
	"peso" integer DEFAULT 5 NOT NULL,
	"observacoes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tempo_estimado_min" integer DEFAULT 30 NOT NULL,
	"dificuldade" "dificuldade" DEFAULT 'media' NOT NULL,
	"status" "topic_status" DEFAULT 'nao_iniciado' NOT NULL,
	"observacoes" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_id" uuid NOT NULL,
	"segunda_min" integer DEFAULT 0 NOT NULL,
	"terca_min" integer DEFAULT 0 NOT NULL,
	"quarta_min" integer DEFAULT 0 NOT NULL,
	"quinta_min" integer DEFAULT 0 NOT NULL,
	"sexta_min" integer DEFAULT 0 NOT NULL,
	"sabado_min" integer DEFAULT 0 NOT NULL,
	"domingo_min" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_planning_id_plannings_id_fk" FOREIGN KEY ("planning_id") REFERENCES "public"."plannings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_sessions" ADD CONSTRAINT "planned_sessions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_planning_id_plannings_id_fk" FOREIGN KEY ("planning_id") REFERENCES "public"."plannings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_availabilities" ADD CONSTRAINT "weekly_availabilities_planning_id_plannings_id_fk" FOREIGN KEY ("planning_id") REFERENCES "public"."plannings"("id") ON DELETE cascade ON UPDATE no action;