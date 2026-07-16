"use client";

import { useEffect } from "react";

const SCRIPTS = [
  "/assets/js/vendor/jquery.js",
  "/assets/js/bootstrap-bundle.js",
  "/assets/js/gsap.js",
  "/assets/js/gsap-scroll-to-plugin.js",
  "/assets/js/gsap-scroll-smoother.js",
  "/assets/js/gsap-scroll-trigger.js",
  "/assets/js/gsap-split-text.js",
  "/assets/js/chroma.min.js",
  "/assets/js/three.js",
  "/assets/js/tween-max.js",
  "/assets/js/scroll-magic.js",
  "/assets/js/range-slider.js",
  "/assets/js/swiper-bundle.js",
  "/assets/js/slick.js",
  "/assets/js/slick-safe.js",
  "/assets/js/magnific-popup.js",
  "/assets/js/nice-select.js",
  "/assets/js/purecounter.js",
  "/assets/js/beforeafter.js",
  "/assets/js/isotope-pkgd.js",
  "/assets/js/imagesloaded-pkgd.js",
  "/assets/js/ajax-form.js",
  "/assets/js/webgl.js",
  "/js/lucide-svgs.js",
  "/assets/js/main.js",
  "/assets/js/tp-cursor.js",
  "/assets/js/custom-loader.js",
];

const IS_DEV = process.env.NODE_ENV === "development";

/** Scripts that should re-execute after Fast Refresh (contain page init) */
const RELOADABLE_IN_DEV = new Set([
  "/assets/js/slick-safe.js",
  "/assets/js/main.js",
  "/assets/js/custom-loader.js",
]);

function withDevBust(src: string) {
  if (!IS_DEV) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}dev=${Date.now()}`;
}

function loadScript(src: string, { force = false } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelectorAll(`script[data-herman-src="${src}"]`);
    if (force) {
      existing.forEach((node) => node.remove());
    } else if (existing.length > 0) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = withDevBust(src);
    script.async = false;
    script.dataset.hermanSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    initPortfolio11Sliders?: () => void;
  }
}

export default function LegacyHomeScripts() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (const src of SCRIPTS) {
        if (cancelled) return;
        const force = IS_DEV && RELOADABLE_IN_DEV.has(src);
        await loadScript(src, { force });
      }
      if (cancelled) return;
      window.initPortfolio11Sliders?.();
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
