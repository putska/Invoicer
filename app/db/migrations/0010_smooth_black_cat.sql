ALTER TABLE "attachments" ADD COLUMN "shared_link" text;--> statement-breakpoint
ALTER TABLE "tokens" DROP COLUMN IF EXISTS "shared_link";