ALTER TABLE "purchase_orders" ADD COLUMN "job_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_job_id_projects_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
