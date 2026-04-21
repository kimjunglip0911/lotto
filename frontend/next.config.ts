import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 60000,
    externalDir: true,
  },
  webpack: (config) => {
    config.resolve.alias["@features"] = path.resolve(__dirname, "../features");
    return config;
  },
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8010/api/:path*",
      },
    ];
  },
};

export default nextConfig;
