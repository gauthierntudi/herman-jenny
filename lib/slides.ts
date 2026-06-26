import { readdirSync } from "fs";
import { join } from "path";

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export function getSlidePaths(): string[] {
  const slidesDir = join(process.cwd(), "public", "img", "slides");

  try {
    const files = readdirSync(slidesDir)
      .filter((f) => f && f[0] !== "." && IMAGE_EXT.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    return files.map((f) => `/img/slides/${f}`);
  } catch {
    return [];
  }
}
