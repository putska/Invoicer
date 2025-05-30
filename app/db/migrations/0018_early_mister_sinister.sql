CREATE TABLE "engineering_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"text" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "engineering_notes" ADD CONSTRAINT "engineering_notes_category_id_note_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."note_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_categories" ADD CONSTRAINT "note_categories_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_checklist_items" ADD CONSTRAINT "note_checklist_items_checklist_id_note_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."note_checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_checklists" ADD CONSTRAINT "note_checklists_note_id_engineering_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."engineering_notes"("id") ON DELETE cascade ON UPDATE no action;