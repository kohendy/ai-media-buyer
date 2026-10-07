import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL belum diisi. Salin .env.example ke .env.local lalu isi koneksi Neon (pooled).",
  );
}

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { __aimbSql?: Sql };

/**
 * postgres.js dengan koneksi pooled Neon.
 * `prepare: false` wajib untuk PgBouncer (pooled) Neon.
 */
const sql =
  globalForDb.__aimbSql ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__aimbSql = sql;
}

export const db = drizzle(sql, { schema, casing: "snake_case" });
export const rawSql = sql;
export { schema };
