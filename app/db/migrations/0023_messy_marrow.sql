ALTER TABLE "activities" DROP CONSTRAINT "activities_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "manpower" DROP CONSTRAINT "manpower_activity_id_activities_id_fk";
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manpower" ADD CONSTRAINT "manpower_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;