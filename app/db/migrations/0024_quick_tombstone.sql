ALTER TABLE "material_takeoffs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "model_comments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "model_views" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "takeoff_items" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "material_takeoffs" CASCADE;--> statement-breakpoint
DROP TABLE "model_comments" CASCADE;--> statement-breakpoint
DROP TABLE "model_views" CASCADE;--> statement-breakpoint
DROP TABLE "takeoff_items" CASCADE;--> statement-breakpoint
DROP INDEX "bim_elements_model_id_idx";--> statement-breakpoint
DROP INDEX "bim_elements_type_idx";--> statement-breakpoint
DROP INDEX "bim_elements_ifc_id_idx";--> statement-breakpoint
DROP INDEX "bim_models_file_path_idx";--> statement-breakpoint
DROP INDEX "bim_models_project_idx";--> statement-breakpoint
DROP INDEX "bim_models_created_at_idx";--> statement-breakpoint
CREATE INDEX "idx_bim_elements_model_id" ON "bim_elements" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "idx_bim_elements_ifc_id" ON "bim_elements" USING btree ("ifc_id");--> statement-breakpoint
CREATE INDEX "idx_bim_elements_type" ON "bim_elements" USING btree ("element_type");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_model_ifc" ON "bim_elements" USING btree ("model_id","ifc_id");--> statement-breakpoint
CREATE INDEX "idx_bim_models_project" ON "bim_models" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_bim_models_active" ON "bim_models" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_bim_models_upload_date" ON "bim_models" USING btree ("upload_date");