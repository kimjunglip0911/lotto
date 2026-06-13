import type { NextConfig } from "next";
import path from "path";

/** 로컬 dev: 상대 `/api/...` 요청을 Nest(기본 8010)로 넘김. NEXT_PUBLIC_API_URL이 있으면 그 호스트를 사용 */
const apiProxyOrigin = (
  process.env.API_PROXY_TARGET ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8010"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyOrigin}/api/:path*`,
      },
    ];
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
