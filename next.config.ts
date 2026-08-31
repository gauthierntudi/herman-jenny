import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // Accès HMR depuis le téléphone / le réseau local (npm run dev)
  allowedDevOrigins: ["172.20.10.6"],
  // Fix: Next.js voyait /Users/mac/Documents/package-lock.json et prenait ce dossier comme racine
  outputFileTracingRoot: path.join(__dirname),
  images: {
    unoptimized: true,
  },
  // Turbopack (défaut Next 16) — HTML en raw pour Fast Refresh
  turbopack: {
    rules: {
      "*.html": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  async headers() {
    if (!isDev) return [];
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
      {
        source: "/js/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/index.php", destination: "/", permanent: true },
      { source: "/savethedate.php", destination: "/savethedate", permanent: true },
      { source: "/admin.php", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
