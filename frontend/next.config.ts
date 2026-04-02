import type { NextConfig } from "next";
import path from "path";

// #region agent log
console.error("[agent-debug][H1] next.config module loaded");
fetch("http://127.0.0.1:7844/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"92c877"},body:JSON.stringify({sessionId:"92c877",runId:"pre-fix",hypothesisId:"H1",location:"frontend/next.config.ts:4",message:"next config module loaded",data:{nodeEnv:process.env.NODE_ENV??null,hasWebpackConfig:true,hasTurbopackConfig:false},timestamp:Date.now()})}).catch(()=>{});
// #endregion

const nextConfig: NextConfig = {
  experimental: {
    proxyTimeout: 60000,
    externalDir: true,
  },
  webpack: (config) => {
    // #region agent log
    console.error("[agent-debug][H2] webpack callback invoked");
    fetch("http://127.0.0.1:7844/ingest/abffb62d-8118-4522-ba11-17c2ce3f222c",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"92c877"},body:JSON.stringify({sessionId:"92c877",runId:"pre-fix",hypothesisId:"H2",location:"frontend/next.config.ts:12",message:"webpack callback invoked",data:{hasResolve:Boolean(config.resolve),hasAlias:Boolean(config.resolve?.alias)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    config.resolve.alias["@features"] = path.resolve(__dirname, "../features");
    return config;
  },
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
