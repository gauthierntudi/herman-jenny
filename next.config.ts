import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    unoptimized: true,
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
