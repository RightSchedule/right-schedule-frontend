import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isPublicPath } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  // HttpOnly cookies set by the backend; presence only, the backend validates them. The access token lives
  // 15 min, so session_active (a secret-free marker that lasts as long as the refresh token) keeps the user on
  // the page while the API client refreshes the session on its first 401.
  const hasSession =
    request.cookies.get("access_token")?.value || request.cookies.get("session_active")?.value;

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
