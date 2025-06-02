CREATE TABLE "note_status_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"status_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "note_status_assignments_note_id_status_id_unique" UNIQUE("note_id","status_id")
);
--> statement-breakpoint
ALTER TABLE "engineering_notes" DROP CONSTRAINT "engineering_notes_status_id_note_statuses_id_fk";
--> statement-breakpoint
ALTER TABLE "note_status_assignments" ADD CONSTRAINT "note_status_assignments_note_id_engineering_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."engineering_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_status_assignments" ADD CONSTRAINT "note_status_assignments_status_id_note_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."note_statuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineering_notes" DROP COLUMN "status_id";