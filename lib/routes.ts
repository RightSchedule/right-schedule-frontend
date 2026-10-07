export const PUBLIC_PATH_PREFIXES = ["/login", "/b/", "/privacy", "/terms", "/dpa", "/sub-processors", "/book/"];

// Emailed token links. Exact match: "/quote" must not expose the dashboard's "/quotes".
export const PUBLIC_EXACT_PATHS = [
  "/manage-booking",
  "/quote",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
  "/resend-verification",
  "/leave-waitlist",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_EXACT_PATHS.includes(pathname) || PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}
