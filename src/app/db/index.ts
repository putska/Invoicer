import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  invoicesTable,
  customersTable,
  bankInfoTable,
  projects,
  categories,
  activities,
  manpower,
  users,
  laborSnapshots,
} from "./schema";

if (!process.env.NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL must be a Neon postgres connection string");
}
const sql = neon(process.env.NEON_DATABASE_URL!);

export const invoicesDB = drizzle(sql, {
  schema: { invoicesTable },
});

export const customersDB = drizzle(sql, {
  schema: { customersTable },
});

export const bankInfoDB = drizzle(sql, {
  schema: { bankInfoTable },
});

export const projectsDB = drizzle(sql, {
  schema: { projects },
});

export const categoriesDB = drizzle(sql, {
  schema: { categories },
});

export const activitiesDB = drizzle(sql, {
  schema: { activities },
});

export const manpowerDB = drizzle(sql, {
  schema: { manpower },
});

export const usersDB = drizzle(sql, {
  schema: { users },
});

export const laborSnapshotsDB = drizzle(sql, {
  schema: { laborSnapshots },
});

// New database instance for the average manpower function
export const averageManpowerDB = drizzle(sql, {
  schema: { projects, categories, activities, manpower, laborSnapshots },
});
