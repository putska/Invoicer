ALTER TABLE "engineering_notes" ADD COLUMN "status_id" integer;--> statement-breakpoint
ALTER TABLE "engineering_notes" ADD CONSTRAINT "engineering_notes_status_id_note_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."note_statuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "engineering_notes" DROP COLUMN "status";