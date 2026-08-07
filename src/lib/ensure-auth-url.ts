/**
 * NextAuth throws `TypeError: Invalid URL` when AUTH_URL / NEXTAUTH_URL
 * is missing or malformed. Ensure a usable absolute URL before auth runs.
 */
export function ensureAuthUrl() {
  const candidates = [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
      : undefined,
    "http://localhost:3000",
  ];

  for (const raw of candidates) {
    if (!raw || !String(raw).trim()) continue;
    try {
      const u = new URL(String(raw).trim());
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      process.env.AUTH_URL = u.origin;
      process.env.NEXTAUTH_URL = u.origin;
      return u.origin;
    } catch {
      /* try next */
    }
  }

  process.env.AUTH_URL = "http://localhost:3000";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  return "http://localhost:3000";
}
