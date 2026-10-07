import { loadEnvConfig } from "@next/env";

// Dimuat sebelum modul lain agar DATABASE_URL tersedia saat `src/db/index.ts` dievaluasi.
loadEnvConfig(process.cwd());
