CREATE TABLE "engineering_task_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"text" varchar(256) NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineering_task_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "engineering_task_checklist_items" ADD CONSTRAINT "engineering_task_checklist_items_checklist_id_engineering_task_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."engineering_task_checklists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineering_task_checklists" ADD CONSTRAINT "engineering_task_checklists_task_id_engineering_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."engineering_tasks"("id") ON DELETE no action ON UPDATE no action;