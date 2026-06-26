export function getSiteUrl(): string {
  const url = process.env.SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return url.replace(/\/$/, "");
}
