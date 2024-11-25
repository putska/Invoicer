// app/db/lib/drizzle.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  invoicesTable,
  customersTable,
  bankInfoTable,
  projects,
  categories,
  activities,
  manpower,
  users,
  laborData,
  attachments,
  purchaseOrders,
  requests,
  materials,
} from "../schema"; // Adjust the path if necessary

if (!process.env.NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL must be a Neon Postgres connection string");
}

const sql = neon(process.env.NEON_DATABASE_URL!);

export const db = drizzle(sql, {
  schema: {
    invoicesTable,
    customersTable,
    bankInfoTable,
    projects,
    categories,
    activities,
    manpower,
    users,
    laborData,
    attachments,
    purchaseOrders,
    materials,
    requests,
  },
});
