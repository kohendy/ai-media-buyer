import { NextResponse } from "next/server";
import { consumeLoginLink, createSessionToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const base = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  if (!token) {
    return NextResponse.redirect(`${base}/login?error=token-kosong`);
  }

  const userId = await consumeLoginLink(token);
  if (!userId) {
    return NextResponse.redirect(`${base}/login?error=tautan-tidak-valid`);
  }

  const session = await createSessionToken(userId);
  const response = NextResponse.redirect(`${base}/`);
  response.cookies.set(getEnv().AUTH_COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: base.startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
