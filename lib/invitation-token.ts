export function extractInvitationToken(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!trimmed) return null;

  const embedded = trimmed.match(/\/i\/([^/?#\s]+)/i);
  if (embedded?.[1]) {
    return decodeURIComponent(embedded[1]).replace(/\.pdf$/i, "").trim();
  }

  const tryPath = (pathname: string) => {
    const match = pathname.match(/\/i\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]).replace(/\.pdf$/i, "").trim();
  };

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme);
    const fromPath = tryPath(url.pathname);
    if (fromPath) return fromPath;
  } catch {
    const fromPath = tryPath(trimmed);
    if (fromPath) return fromPath;
  }

  if (/^\d{5,12}$/.test(trimmed)) return trimmed;
  return null;
}
