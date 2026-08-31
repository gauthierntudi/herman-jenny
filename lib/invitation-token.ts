export function extractInvitationToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tryPath = (pathname: string) => {
    const match = pathname.match(/\/i\/([^/?#]+)/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]).replace(/\.pdf$/i, "").trim();
  };

  try {
    const url = new URL(trimmed);
    const fromPath = tryPath(url.pathname);
    if (fromPath) return fromPath;
  } catch {
    const fromPath = tryPath(trimmed);
    if (fromPath) return fromPath;
  }

  if (/^\d{5,12}$/.test(trimmed)) return trimmed;
  return null;
}
