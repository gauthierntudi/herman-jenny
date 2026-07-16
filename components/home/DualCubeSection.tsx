"use client";

import { useEffect, useMemo, useRef } from "react";

import type { CubeFaces, DualCubeFaces } from "@/lib/dual-cube-faces";

type FaceKey = keyof CubeFaces;

const FACE_KEYS: FaceKey[] = ["front", "top", "back", "side", "bottom"];

type MatchMedia = {
  add: (query: string, fn: () => void | (() => void)) => void;
  revert: () => void;
};

type GsapApi = {
  registerPlugin: (...args: unknown[]) => void;
  matchMedia: () => MatchMedia;
  set: (targets: unknown, vars: Record<string, unknown>) => unknown;
  fromTo: (
    targets: unknown,
    fromVars: Record<string, unknown>,
    toVars: Record<string, unknown>,
  ) => unknown;
};

function getWindowGsap(): GsapApi | undefined {
  return (window as Window & { gsap?: GsapApi }).gsap;
}

function getScrollTrigger(): { refresh: () => void } | undefined {
  return (window as Window & { ScrollTrigger?: { refresh: () => void } }).ScrollTrigger;
}

function waitForGsap(timeoutMs = 8000): Promise<GsapApi> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const gsap = getWindowGsap();
      if (gsap && getScrollTrigger()) {
        resolve(gsap);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("GSAP not available"));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededMonoFaces(seed: string): Set<FaceKey> {
  let state = hashString(seed);
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const shuffled = [...FACE_KEYS];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(next() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  const monoCount = 1 + Math.floor(next() * FACE_KEYS.length);
  return new Set(shuffled.slice(0, monoCount));
}

function monoSeed(variant: "left" | "right", faces: CubeFaces) {
  return `${variant}:${faces.front}|${faces.top}|${faces.side}|${faces.back}|${faces.bottom}`;
}

type CubeProps = {
  faces: CubeFaces;
  variant: "left" | "right";
  monoFaces: Set<FaceKey>;
};

function faceClass(key: FaceKey, positionClass: string, monoFaces: Set<FaceKey>) {
  return [
    "dual-cube__face",
    positionClass,
    monoFaces.has(key) ? "dual-cube__face--mono" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function Cube({ faces, variant, monoFaces }: CubeProps) {
  const sideFace = variant === "left" ? "right" : "left";

  return (
    <div className={`dual-cube dual-cube--${variant}`}>
      <div
        className={faceClass("front", "dual-cube__face--front", monoFaces)}
        style={{ backgroundImage: `url(${faces.front})` }}
      />
      <div
        className={faceClass("top", "dual-cube__face--top", monoFaces)}
        style={{ backgroundImage: `url(${faces.top})` }}
      />
      <div
        className={faceClass("back", "dual-cube__face--back", monoFaces)}
        style={{ backgroundImage: `url(${faces.back})` }}
      />
      <div
        className={faceClass("side", `dual-cube__face--${sideFace}`, monoFaces)}
        style={{ backgroundImage: `url(${faces.side})` }}
      />
      <div
        className={faceClass("bottom", "dual-cube__face--bottom", monoFaces)}
        style={{ backgroundImage: `url(${faces.bottom})` }}
      />
    </div>
  );
}

export default function DualCubeSection({ faces }: { faces: DualCubeFaces }) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftCubeRef = useRef<HTMLDivElement>(null);
  const rightCubeRef = useRef<HTMLDivElement>(null);
  const leftMonoFaces = useMemo(
    () => seededMonoFaces(monoSeed("left", faces.left)),
    [faces.left],
  );
  const rightMonoFaces = useMemo(
    () => seededMonoFaces(monoSeed("right", faces.right)),
    [faces.right],
  );

  useEffect(() => {
    let cancelled = false;
    let mm: MatchMedia | null = null;

    (async () => {
      try {
        const gsap = await waitForGsap();
        if (cancelled) return;

        await new Promise((r) => setTimeout(r, 400));
        if (cancelled) return;

        const section = sectionRef.current;
        const leftCube = leftCubeRef.current;
        const rightCube = rightCubeRef.current;
        if (!section || !leftCube || !rightCube) return;

        gsap.registerPlugin(getScrollTrigger());
        mm = gsap.matchMedia();

        mm.add("(prefers-reduced-motion: reduce)", () => {
          gsap.set([leftCube, rightCube], { clearProps: "transform" });
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
          const SCROLL_ROTATION_MULTIPLIER = 4;
          const ROTATION_DEGREES = 360 * SCROLL_ROTATION_MULTIPLIER;
          const scrollConfig = {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.85,
            invalidateOnRefresh: true,
          };

          gsap.set(leftCube, {
            transformOrigin: "100% 50%",
            transformPerspective: 1100,
            rotateX: 0,
            rotateY: 0,
            force3D: true,
          });
          gsap.set(rightCube, {
            transformOrigin: "0% 50%",
            transformPerspective: 1100,
            rotateX: 0,
            rotateY: 0,
            force3D: true,
          });

          gsap.fromTo(
            leftCube,
            { rotateX: 0 },
            {
              rotateX: -ROTATION_DEGREES,
              ease: "none",
              force3D: true,
              scrollTrigger: { ...scrollConfig },
            },
          );

          gsap.fromTo(
            rightCube,
            { rotateX: 0 },
            {
              rotateX: ROTATION_DEGREES,
              ease: "none",
              force3D: true,
              scrollTrigger: { ...scrollConfig },
            },
          );
        });

        getScrollTrigger()?.refresh();
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
      mm?.revert();
    };
  }, []);

  return (
    <div className="dual-cube-section-outer">
      <div className="dual-cube-section__name dual-cube-section__name--left">
        <span>Herman</span>
      </div>

      <section ref={sectionRef} className="dual-cube-section" aria-label="Herman et Jennifer">
        <div className="dual-cube-section__panel dual-cube-section__panel--left" />
        <div className="dual-cube-section__panel dual-cube-section__panel--right" />

        <div className="dual-cube-section__stage">
          <div className="dual-cube-section__cubes">
            <div ref={leftCubeRef} className="dual-cube-section__cube dual-cube-section__cube--left">
              <Cube faces={faces.left} variant="left" monoFaces={leftMonoFaces} />
            </div>
            <div ref={rightCubeRef} className="dual-cube-section__cube dual-cube-section__cube--right">
              <Cube faces={faces.right} variant="right" monoFaces={rightMonoFaces} />
            </div>
          </div>
        </div>
      </section>

      <div className="dual-cube-section__name dual-cube-section__name--right">
        <span>Jennifer</span>
      </div>
    </div>
  );
}
