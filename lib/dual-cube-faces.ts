import { getSlidePaths } from "@/lib/slides";

const EXCLUDED_SLIDES = new Set(["03.jpg", "015.jpg"]);

export type CubeFaces = {
  front: string;
  top: string;
  side: string;
  back: string;
  bottom: string;
};

export type DualCubeFaces = {
  left: CubeFaces;
  right: CubeFaces;
};

const FACE_ORDER = ["front", "top", "side", "back", "bottom"] as const;

export function getCubeSlidePool(): string[] {
  return getSlidePaths().filter((path) => {
    const name = path.split("/").pop() ?? "";
    return !EXCLUDED_SLIDES.has(name);
  });
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function facesFrom(paths: string[]): CubeFaces {
  const fallback = paths[0] ?? "/img/slides/01.jpg";
  return {
    front: paths[0] ?? fallback,
    top: paths[1] ?? fallback,
    side: paths[2] ?? fallback,
    back: paths[3] ?? fallback,
    bottom: paths[4] ?? fallback,
  };
}

/** 10 faces (5 + 5) tirées au hasard depuis /img/slides, sans 03.jpg ni 015.jpg */
export function getRandomDualCubeFaces(): DualCubeFaces {
  const pool = shuffle(getCubeSlidePool());
  const needed = FACE_ORDER.length * 2;
  const picked: string[] = [];

  for (let index = 0; index < needed; index += 1) {
    picked.push(pool[index % Math.max(pool.length, 1)] ?? "/img/slides/01.jpg");
  }

  return {
    left: facesFrom(picked.slice(0, 5)),
    right: facesFrom(picked.slice(5, 10)),
  };
}
