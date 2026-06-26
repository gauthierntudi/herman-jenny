function hashName(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Couleur variée stable par nom (aspect aléatoire, sans flicker SSR). */
export function avatarColor(name: string): string {
  const h = hashName(name);
  const hue = h % 360;
  const saturation = 58 + (h % 22);
  const lightness = 40 + ((h >> 8) % 16);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";

  const words = trimmed.match(/\p{L}+/gu) ?? [];
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    const w = words[0];
    return w.length >= 2 ? w.slice(0, 2).toUpperCase() : w[0].toUpperCase();
  }

  const digits = trimmed.match(/\d/g);
  if (digits?.length) return digits.slice(0, 2).join("");
  return "?";
}

type Props = {
  name: string;
  size?: number;
  className?: string;
};

export default function GuestAvatar({ name, size = 36, className }: Props) {
  const fontSize = Math.max(10, Math.round(size * 0.32));

  return (
    <div
      className={`admin-avatar${className ? ` ${className}` : ""}`}
      style={{
        background: avatarColor(name),
        width: size,
        height: size,
        fontSize,
      }}
      aria-hidden="true"
    >
      {avatarInitial(name)}
    </div>
  );
}
