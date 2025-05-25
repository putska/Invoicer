CREATE TABLE "engineering_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"notes" text,
	"duration_days" integer NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'unassigned' NOT NULL,
	"is_last_minute" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "engineers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"engineer_id" integer NOT NULL,
	"position" integer NOT NULL,
	"scheduled_start" date,
	"scheduled_end" date,
	"actual_start" date,
	"actual_end" date,
	"assigned_by" text NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"performed_by" text NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "engineering_tasks" ADD CONSTRAINT "engineering_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_engineering_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."engineering_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_engineer_id_engineers_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."engineers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_task_id_engineering_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."engineering_tasks"("id") ON DELETE cascade ON UPDATE no action;