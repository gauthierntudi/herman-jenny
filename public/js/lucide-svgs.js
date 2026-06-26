/** Inline Lucide SVG strings for legacy vanilla JS (savethedate, main.js). */
(function (global) {
  function svg(name, size, cls) {
    const s = size || 18;
    const c = cls ? ` class="${cls}"` : "";
    const common = `xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${c}`;

    const paths = {
      loader: `<svg ${common}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
      heart: `<svg ${common}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
      rotateCw: `<svg ${common}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`,
      calendarCheck: `<svg ${common}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>`,
      calendarX: `<svg ${common}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m14 14-4 4"/><path d="m10 14 4 4"/></svg>`,
      chevronLeft: `<svg ${common}><path d="m15 18-6-6 6-6"/></svg>`,
      chevronRight: `<svg ${common}><path d="m9 18 6-6-6-6"/></svg>`,
      plus: `<svg ${common}><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    };

    return paths[name] || "";
  }

  global.LucideSvg = {
    loader: (size, cls) => svg("loader", size, (cls || "") + " lucide-spin"),
    heart: (size, cls) => svg("heart", size, cls),
    rotateCw: (size, cls) => svg("rotateCw", size, cls),
    calendarCheck: (size, cls) => svg("calendarCheck", size, cls),
    calendarX: (size, cls) => svg("calendarX", size, cls),
    chevronLeft: (size, cls) => svg("chevronLeft", size, cls),
    chevronRight: (size, cls) => svg("chevronRight", size, cls),
    plus: (size, cls) => svg("plus", size, cls),
  };
})(typeof window !== "undefined" ? window : globalThis);
