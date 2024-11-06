CREATE TABLE IF NOT EXISTS "labor_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"last_name" text,
	"first_name" text,
	"eid" integer,
	"day" text,
	"date" text,
	"project_id" integer NOT NULL,
	"job_number" text,
	"cost_code_division" text,
	"cost_code_number" text,
	"cost_code_description" text,
	"classification" text,
	"shift" text,
	"pay_type" text,
	"hours" numeric,
	"start_time" text,
	"end_time" text,
	"breaks" integer,
	"meal_breaks" integer,
	"total_break_time" text,
	"work_log_name" text,
	"payroll_notes" text,
	"payroll_attachments" text
);
--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "freight" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "boxing_charges" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "job_number" text;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_job_number_unique" UNIQUE("job_number");