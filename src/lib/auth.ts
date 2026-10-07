import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { loginLinks, users, type User } from "@/db/schema";
import { getEnv } from "./env";

const encoder = new TextEncoder();
const secretKey = () => encoder.encode(getEnv().AUTH_SECRET);

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Buat tautan sekali pakai untuk masuk dashboard (dikirim bot /login). */
export async function createLoginLink(userId: string, ttlMinutes = 5) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
  await db.insert(loginLinks).values({ userId, tokenHash: hashToken(token), expiresAt });
  const base = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return { token, url: `${base}/api/auth/link?token=${token}`, expiresAt };
}

/** Tukar tautan menjadi userId; tautan hanya bisa dipakai sekali. */
export async function consumeLoginLink(token: string): Promise<string | null> {
  const [link] = await db
    .select()
    .from(loginLinks)
    .where(
      and(
        eq(loginLinks.tokenHash, hashToken(token)),
        isNull(loginLinks.usedAt),
        gt(loginLinks.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!link) return null;
  await db.update(loginLinks).set({ usedAt: new Date() }).where(eq(loginLinks.id, link.id));
  return link.userId;
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const env = getEnv();
  const store = await cookies();
  store.set(env.AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NEXT_PUBLIC_APP_URL.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(getEnv().AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(getEnv().AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = await readSessionToken(token);
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "owner") throw new UnauthorizedError();
  return user;
}

/** Cek rahasia webhook/n8n sederhana dari header. */
export function checkSharedSecret(provided: string | null, expected: string | undefined) {
  if (!expected) return false;
  if (!provided) return false;
  return safeEqual(provided, expected);
}
