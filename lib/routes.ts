export const PUBLIC_PATH_PREFIXES = ["/login", "/b/", "/privacy", "/terms", "/dpa", "/sub-processors"];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}
