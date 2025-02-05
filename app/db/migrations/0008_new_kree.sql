CREATE TABLE IF NOT EXISTS "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"service" varchar(50) NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" bigint NOT NULL,
	CONSTRAINT "tokens_service_unique" UNIQUE("service")
);
