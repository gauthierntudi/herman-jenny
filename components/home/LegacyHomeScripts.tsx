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

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export default function LegacyHomeScripts() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (const src of SCRIPTS) {
        if (cancelled) return;
        await loadScript(src);
      }
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
