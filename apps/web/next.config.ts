import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/analysis/:path*", destination: "/combination", permanent: true },
    ];
  },
};

export default nextConfig;
