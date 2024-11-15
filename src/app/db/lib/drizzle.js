"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
// src/app/db/lib/drizzle.ts
var neon_http_1 = require("drizzle-orm/neon-http");
var serverless_1 = require("@neondatabase/serverless");
var schema_1 = require("../schema"); // Adjust the path if necessary
if (!process.env.NEON_DATABASE_URL) {
  throw new Error("DATABASE_URL must be a Neon Postgres connection string");
}
var sql = (0, serverless_1.neon)(process.env.NEON_DATABASE_URL);
exports.db = (0, neon_http_1.drizzle)(sql, {
  schema: {
    invoicesTable: schema_1.invoicesTable,
    customersTable: schema_1.customersTable,
    bankInfoTable: schema_1.bankInfoTable,
    projects: schema_1.projects,
    categories: schema_1.categories,
    activities: schema_1.activities,
    manpower: schema_1.manpower,
    users: schema_1.users,
    laborData: schema_1.laborData,
  },
});
