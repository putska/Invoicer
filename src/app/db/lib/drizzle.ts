// src/app/db/lib/drizzle.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Initialize a single instance of the pool to be reused across requests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Ensure this is set in your environment variables
  ssl: {
    rejectUnauthorized: false, // Required for Neon PostgreSQL
  },
});

// Export the Drizzle ORM instance
export const db = drizzle(pool);
