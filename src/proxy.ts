import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/env";
import { jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function proxy(request: NextRequest) {
  const env = getEnv();
  const { pathname } = request.nextUrl;

  // Allow login page and auth endpoints
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow static files, _next, public assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get(env.AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, encoder.encode(env.AUTH_SECRET));
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // Match all routes except api, _next/static, _next/image, public files
  matcher: [
    "/:path*",
  ],
};