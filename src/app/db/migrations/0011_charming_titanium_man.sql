ALTER TABLE "labor_data" ADD COLUMN "project_name" text;--> statement-breakpoint
ALTER TABLE "labor_data" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "labor_data" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "labor_data" DROP COLUMN IF EXISTS "project_id";