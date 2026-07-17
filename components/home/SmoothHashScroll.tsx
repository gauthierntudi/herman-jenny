"use client";

import { useEffect } from "react";

const GIFT_HASH = "#gift-universe";
const GIFT_HREFS = new Set(["#gift-universe", "/#gift-universe"]);

type ScrollSmootherLike = {
  scrollTo: (
    target: string | Element | number,
    smooth?: boolean,
    position?: string,
  ) => void;
};

function getSmoother(): ScrollSmootherLike | null {
  const gsapWin = window as Window & {
    ScrollSmoother?: { get?: () => ScrollSmootherLike | undefined };
  };
  return gsapWin.ScrollSmoother?.get?.() ?? null;
}

function scrollToGiftUniverse(smooth = true) {
  const el = document.getElementById("gift-universe");
  if (!el) return false;

  const smoother = getSmoother();
  if (smoother) {
    // Native hash jump breaks ScrollSmoother (white gap / unreachable top).
    smoother.scrollTo(el, smooth, "top 100px");
    return true;
  }

  el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  return true;
}

function isHomePath(pathname: string) {
  return pathname === "/" || pathname === "";
}

/**
 * Intercepts #gift-universe navigation so ScrollSmoother stays in sync.
 */
export default function SmoothHashScroll() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || !GIFT_HREFS.has(href)) return;
      if (!isHomePath(window.location.pathname)) return;

      event.preventDefault();
      scrollToGiftUniverse(true);
      window.history.replaceState(null, "", GIFT_HASH);
    };

    document.addEventListener("click", onClick, true);

    // Landing on /#gift-universe after scripts init
    if (window.location.hash === GIFT_HASH) {
      let tries = 0;
      const timer = window.setInterval(() => {
        tries += 1;
        if (scrollToGiftUniverse(false) && getSmoother()) {
          window.clearInterval(timer);
          return;
        }
        if (tries >= 50) window.clearInterval(timer);
      }, 100);

      return () => {
        document.removeEventListener("click", onClick, true);
        window.clearInterval(timer);
      };
    }

    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
