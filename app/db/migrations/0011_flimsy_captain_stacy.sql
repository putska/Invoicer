CREATE TABLE IF NOT EXISTS "forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"form_name" text NOT NULL,
	"pdf_form" text NOT NULL,
	"job_name" text NOT NULL,
	"user_name" text NOT NULL,
	"date_created" text,
	"submission_date" timestamp DEFAULT now() NOT NULL,
	"form_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
