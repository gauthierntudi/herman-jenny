export function formatTableLabel(name?: string | null) {
  if (!name) return null;
  const match = name.match(/table\s*(\d+)/i);
  if (match?.[1]) return `Table ${match[1]}`;
  return name.trim();
}

export function parseTableNumber(name?: string | null) {
  if (!name) return null;
  const match = name.match(/table\s*(\d+)/i);
  return match?.[1] ?? null;
}
