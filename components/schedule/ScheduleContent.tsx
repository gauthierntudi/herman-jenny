"use client";

import { useEffect, useRef } from "react";
import ScheduleMasonryBg from "@/components/schedule/ScheduleMasonryBg";

type TimelineItem = {
  time: string;
  title: string;
  detail?: string;
};

type Props = {
  blessing: { title: string; time: string; detail?: string };
  prelude: { time: string; title: string; lines: string[] };
  timeline: TimelineItem[];
  slideImages: string[];
};

type GsapLike = {
  registerPlugin: (...args: unknown[]) => void;
  context: (fn: () => void, scope?: unknown) => { revert: () => void };
  from: (targets: unknown, vars: Record<string, unknown>) => unknown;
  fromTo: (targets: unknown, fromVars: Record<string, unknown>, toVars: Record<string, unknown>) => unknown;
  set: (targets: unknown, vars: Record<string, unknown>) => unknown;
  utils: { toArray: <T>(targets: unknown) => T[] };
};

declare global {
  interface Window {
    gsap?: GsapLike;
    ScrollTrigger?: { refresh: () => void };
  }
}

function waitForGsap(timeoutMs = 8000): Promise<GsapLike> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (window.gsap && window.ScrollTrigger) {
        resolve(window.gsap);
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

/** play on enter, reverse on leave — marche en scroll down et scroll up */
const SCROLL_BOTH = "play reverse play reverse";

export default function ScheduleContent({ blessing, prelude, timeline, slideImages }: Props) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    let ctx: { revert: () => void } | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const gsap = await waitForGsap();
        if (cancelled || !rootRef.current) return;

        await new Promise((r) => setTimeout(r, 400));
        if (cancelled || !rootRef.current) return;

        const ScrollTrigger = window.ScrollTrigger!;
        gsap.registerPlugin(ScrollTrigger);

        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
          gsap.set(rootRef.current.querySelectorAll("[data-anim]"), {
            clearProps: "all",
            opacity: 1,
            y: 0,
          });
          return;
        }

        ctx = gsap.context(() => {
          gsap.utils.toArray<HTMLElement>("[data-anim='intro']").forEach((el, i) => {
            gsap.from(el, {
              opacity: 0,
              y: 32,
              duration: 0.85,
              delay: i * 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                end: "top 20%",
                toggleActions: SCROLL_BOTH,
              },
            });
          });

          gsap.utils.toArray<HTMLElement>("[data-anim='label']").forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 16,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                end: "top 15%",
                toggleActions: SCROLL_BOTH,
              },
            });
          });

          gsap.utils.toArray<HTMLElement>("[data-anim='row']").forEach((el) => {
            gsap.from(el, {
              opacity: 0,
              y: 24,
              duration: 0.65,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 92%",
                end: "top 12%",
                toggleActions: SCROLL_BOTH,
              },
            });
          });

          const line = rootRef.current!.querySelector("[data-anim='line']");
          if (line) {
            gsap.fromTo(
              line,
              { scaleY: 0 },
              {
                scaleY: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: ".schedule-timeline",
                  start: "top 80%",
                  end: "bottom 40%",
                  scrub: 0.5,
                },
              }
            );
          }

          gsap.from("[data-anim='venue']", {
            opacity: 0,
            y: 16,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: "[data-anim='venue']",
              start: "top 95%",
              end: "top 20%",
              toggleActions: SCROLL_BOTH,
            },
          });
        }, rootRef);

        refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
      } catch {
        /* page reste lisible */
      }
    })();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      ctx?.revert();
    };
  }, []);

  return (
    <main className="schedule-main" ref={rootRef}>
      <div className="schedule-bg" aria-hidden="true">
        <ScheduleMasonryBg images={slideImages} />
        <div className="schedule-bg-veil" />
      </div>

      <div className="container schedule-content">
        <header className="schedule-intro">
          <p className="schedule-eyebrow" data-anim="intro">
            Saturday, September 5th, 2026
          </p>
          <h1 className="schedule-title" data-anim="intro">
            The Day’s Schedule
          </h1>
          <p className="schedule-lede" data-anim="intro">
            From afternoon blessings to an evening of joy — here is how we will celebrate with you.
          </p>
        </header>

        <div className="schedule-timeline" aria-label="Wedding day timeline">
          <span className="schedule-tl-line" aria-hidden="true" data-anim="line" />

          <div className="schedule-tl-chapter" data-anim="label">
            <span>Afternoon</span>
          </div>

          <article className="schedule-tl-item schedule-tl-item--feature" data-anim="row">
            <time className="schedule-tl-time">{blessing.time}</time>
            <span className="schedule-tl-dot" aria-hidden="true" />
            <div className="schedule-tl-body">
              <h2 id="blessing-heading">{blessing.title}</h2>
              {blessing.detail ? <p>{blessing.detail}</p> : null}
            </div>
          </article>

          <div className="schedule-tl-chapter" data-anim="label">
            <span>Evening Reception</span>
          </div>

          <article className="schedule-tl-item schedule-tl-item--head" data-anim="row">
            <span className="schedule-tl-time schedule-tl-time--blank" aria-hidden="true" />
            <span className="schedule-tl-dot schedule-tl-dot--lg" aria-hidden="true" />
            <div className="schedule-tl-body">
              <h2 id="reception-heading">Grand Reception Party</h2>
            </div>
          </article>

          <article className="schedule-tl-item" data-anim="row">
            <time className="schedule-tl-time">{prelude.time}</time>
            <span className="schedule-tl-dot" aria-hidden="true" />
            <div className="schedule-tl-body">
              <h3>{prelude.title}</h3>
              <ul>
                {prelude.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </article>

          {timeline.map((item) => (
            <article key={`${item.time}-${item.title}`} className="schedule-tl-item" data-anim="row">
              <time className="schedule-tl-time">{item.time}</time>
              <span className="schedule-tl-dot" aria-hidden="true" />
              <div className="schedule-tl-body">
                <h3>{item.title}</h3>
                {item.detail ? <p>{item.detail}</p> : null}
              </div>
            </article>
          ))}
        </div>

        <p className="schedule-venue" data-anim="venue">
          Park Regency Hotel · Bloomington, Illinois
        </p>
      </div>
    </main>
  );
}
