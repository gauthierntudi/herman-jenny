import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
