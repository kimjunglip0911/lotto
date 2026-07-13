import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  async redirects() {
    return [
      { source: "/analysis/:path*", destination: "/combination", permanent: true },
    ];
  },
  webpack: (config) => {
    config.resolve.alias["@features"] = path.resolve(__dirname, "../../features");
    return config;
  },
};

export default nextConfig;
