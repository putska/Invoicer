CREATE TABLE "bim_elements" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"ifc_id" varchar(255) NOT NULL,
	"element_type" varchar(100),
	"element_name" varchar(255),
	"level" varchar(100),
	"material" varchar(255),
	"properties" jsonb,
	"geometry_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bim_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"file_path" varchar(500) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint,
	"mime_type" varchar(100),
	"upload_date" timestamp DEFAULT now(),
	"uploaded_by" integer,
	"version" varchar(50),
	"revit_version" varchar(50),
	"ifc_schema" varchar(50),
	"project_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" integer,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "material_takeoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"takeoff_name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft',
	"total_cost" numeric(12, 2),
	"created_date" timestamp DEFAULT now(),
	"created_by" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "model_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"element_id" integer,
	"comment_text" text NOT NULL,
	"position" jsonb,
	"status" varchar(50) DEFAULT 'open',
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"resolved_at" timestamp,
	"attachments" jsonb
);
--> statement-breakpoint
CREATE TABLE "model_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer NOT NULL,
	"view_name" varchar(255) NOT NULL,
	"camera_position" jsonb,
	"visible_elements" jsonb,
	"filters" jsonb,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "takeoff_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"takeoff_id" integer NOT NULL,
	"element_id" integer,
	"material_type" varchar(255),
	"material_name" varchar(255),
	"unit" varchar(50),
	"quantity" numeric(12, 4),
	"unit_cost" numeric(10, 4),
	"total_cost" numeric(12, 2),
	"supplier" varchar(255),
	"category" varchar(100),
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "bim_elements" ADD CONSTRAINT "bim_elements_model_id_bim_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."bim_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_takeoffs" ADD CONSTRAINT "material_takeoffs_model_id_bim_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."bim_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_comments" ADD CONSTRAINT "model_comments_model_id_bim_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."bim_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_comments" ADD CONSTRAINT "model_comments_element_id_bim_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."bim_elements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_views" ADD CONSTRAINT "model_views_model_id_bim_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."bim_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_takeoff_id_material_takeoffs_id_fk" FOREIGN KEY ("takeoff_id") REFERENCES "public"."material_takeoffs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takeoff_items" ADD CONSTRAINT "takeoff_items_element_id_bim_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."bim_elements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bim_elements_model_id_idx" ON "bim_elements" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "bim_elements_type_idx" ON "bim_elements" USING btree ("element_type");--> statement-breakpoint
CREATE INDEX "bim_elements_ifc_id_idx" ON "bim_elements" USING btree ("ifc_id");--> statement-breakpoint
CREATE INDEX "bim_models_file_path_idx" ON "bim_models" USING btree ("file_path");--> statement-breakpoint
CREATE INDEX "bim_models_project_idx" ON "bim_models" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "bim_models_created_at_idx" ON "bim_models" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "material_takeoffs_model_id_idx" ON "material_takeoffs" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "material_takeoffs_status_idx" ON "material_takeoffs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "model_comments_model_id_idx" ON "model_comments" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_comments_status_idx" ON "model_comments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "model_comments_assigned_idx" ON "model_comments" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "model_views_model_id_idx" ON "model_views" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_views_public_idx" ON "model_views" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "takeoff_items_takeoff_id_idx" ON "takeoff_items" USING btree ("takeoff_id");--> statement-breakpoint
CREATE INDEX "takeoff_items_element_id_idx" ON "takeoff_items" USING btree ("element_id");--> statement-breakpoint
CREATE INDEX "takeoff_items_category_idx" ON "takeoff_items" USING btree ("category");