import { connection, NextResponse } from "next/server";
import { UnauthorizedError } from "./auth";
import { MetaWriteBlockedError, StorageNotConfiguredError } from "./errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status });
}

/**
 * Pembungkus route handler: menerjemahkan error domain ke HTTP.
 * `connection()` dipanggil di luar try agar isyarat "butuh request asli"
 * tidak tertangkap: Next menandai route dinamis (kompatibel `cacheComponents`)
 * dan melewati tahap prerender saat build.
 */
export async function apiHandler(fn: () => Promise<Response>): Promise<Response> {
  await connection();

  try {
    return await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail(401, "UNAUTHORIZED", "Perlu masuk ke dashboard.");
    if (error instanceof MetaWriteBlockedError) return fail(409, "KILL_SWITCH_ACTIVE", error.message);
    if (error instanceof StorageNotConfiguredError) {
      return fail(503, "STORAGE_NOT_CONFIGURED", error.message);
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api]", message);
    return fail(500, "INTERNAL", "Terjadi kesalahan pada server.");
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}

export function header(request: Request, name: string) {
  return request.headers.get(name) ?? request.headers.get(name.toLowerCase());
}
