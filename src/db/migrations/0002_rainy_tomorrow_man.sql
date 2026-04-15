CREATE TYPE "public"."banca" AS ENUM('cespe', 'fcc', 'fgv', 'vunesp', 'generica');--> statement-breakpoint
CREATE TYPE "public"."question_format" AS ENUM('certo_errado', 'multipla_escolha');--> statement-breakpoint
CREATE TYPE "public"."quiz_mode" AS ENUM('por_materia', 'por_topico', 'misto', 'revisao');--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"resposta_usuario" text NOT NULL,
	"correto" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"banca" "banca" NOT NULL,
	"formato" "question_format" NOT NULL,
	"dificuldade" "dificuldade" NOT NULL,
	"enunciado" text NOT NULL,
	"alternativas" text,
	"resposta_correta" text NOT NULL,
	"explicacao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_session_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_session_id" uuid NOT NULL,
	"subject_id" uuid,
	"topic_id" uuid
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planning_id" uuid NOT NULL,
	"banca" "banca" NOT NULL,
	"modo" "quiz_mode" NOT NULL,
	"total_questoes" integer NOT NULL,
	"acertos" integer DEFAULT 0 NOT NULL,
	"erros" integer DEFAULT 0 NOT NULL,
	"tempo_segundos" integer,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_quiz_session_id_quiz_sessions_id_fk" FOREIGN KEY ("quiz_session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session_filters" ADD CONSTRAINT "quiz_session_filters_quiz_session_id_quiz_sessions_id_fk" FOREIGN KEY ("quiz_session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session_filters" ADD CONSTRAINT "quiz_session_filters_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_session_filters" ADD CONSTRAINT "quiz_session_filters_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_planning_id_plannings_id_fk" FOREIGN KEY ("planning_id") REFERENCES "public"."plannings"("id") ON DELETE cascade ON UPDATE no action;