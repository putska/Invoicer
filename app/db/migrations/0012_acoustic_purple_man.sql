CREATE TABLE IF NOT EXISTS "cut_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer,
	"stock_length" numeric(10, 2) NOT NULL,
	"stock_id" integer NOT NULL,
	"remaining_length" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cuts" (
	"id" serial PRIMARY KEY NOT NULL,
	"cut_pattern_id" integer,
	"part_no" varchar(50) NOT NULL,
	"length" numeric(10, 2) NOT NULL,
	"mark_no" varchar(50),
	"finish" varchar(100),
	"fab" varchar(255),
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "optimization_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) NOT NULL,
	"blade_width" numeric(10, 2) DEFAULT '0.25',
	"results_json" text,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"part_no" varchar(50) NOT NULL,
	"length" numeric(10, 2) NOT NULL,
	"mark_no" varchar(50),
	"finish" varchar(100),
	"fab" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_lengths" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"part_no" varchar(50) NOT NULL,
	"finish" varchar(100),
	"length1" numeric(10, 2) NOT NULL,
	"length2" numeric(10, 2),
	"qty1" integer NOT NULL,
	"qty2" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cut_patterns" ADD CONSTRAINT "cut_patterns_job_id_optimization_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."optimization_jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cuts" ADD CONSTRAINT "cuts_cut_pattern_id_cut_patterns_id_fk" FOREIGN KEY ("cut_pattern_id") REFERENCES "public"."cut_patterns"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "optimization_jobs" ADD CONSTRAINT "optimization_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parts" ADD CONSTRAINT "parts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stock_lengths" ADD CONSTRAINT "stock_lengths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
