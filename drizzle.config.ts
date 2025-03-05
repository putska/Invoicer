import { config } from "dotenv";
import { Config } from "drizzle-kit";

config({ path: ".env" });

if (!process.env.NEON_DATABASE_URL)
  throw new Error("NEON DATABASE_URL not found in environment");

export default {
  schema: "./app/db/schema.ts",
  out: "./app/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
} satisfies Config;
