ALTER TABLE "activities" ALTER COLUMN "equipment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "sort_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "sort_order" SET NOT NULL;