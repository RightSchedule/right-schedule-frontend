import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isPublicPath } from "@/lib/routes";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // HttpOnly cookies set by the backend; presence only, the backend validates them. The access token lives
  // 15 min, so session_active (a secret-free marker that lasts as long as the refresh token) keeps the user on
  // the page while the API client refreshes the session on its first 401.
  const hasSession =
    request.cookies.get("access_token")?.value || request.cookies.get("session_active")?.value;

  // `signedout` marks a deliberate sign-out; a stale cookie must not bounce the user back to the app.
  if (pathname === "/login" && hasSession && !searchParams.has("signedout")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Icons and the manifest must load without a session: browsers and Android's WebAPK service fetch them
  // cookie-less, and a redirect to /login makes the installed app fall back to a blurry favicon.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|icons/).*)",
  ],
};
