CREATE TABLE IF NOT EXISTS "labor_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"snapshot_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"snapshot_data" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "labor_snapshots" ADD CONSTRAINT "labor_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
