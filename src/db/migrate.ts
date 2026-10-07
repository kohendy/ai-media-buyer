import { loadEnvConfig } from "@next/env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL belum diisi (lihat .env.example).");
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false, max: 1 });
const db = drizzle(sql);

async function main() {
  console.log("Menjalankan migrasi Drizzle…");
  await migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });

  console.log("Menerapkan view baca-saja…");
  const views = readFileSync(join(process.cwd(), "src/db/views.sql"), "utf8");
  await sql.unsafe(views);

  console.log("Selesai: tabel + view siap.");
}

main()
  .catch((error) => {
    console.error("Migrasi gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end({ timeout: 5 });
  });
