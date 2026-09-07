import type { NextConfig } from "next";

/**
 * The FastAPI backend (backend/app/main.py) registers no CORSMiddleware, so a
 * browser on :3000 cannot call :8000 directly. Rather than modify the backend,
 * every request is proxied through Next so the API is same-origin.
 *
 * Set BACKEND_URL if uvicorn runs somewhere other than 127.0.0.1:8000.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // A stray package-lock.json above the repo makes Turbopack guess the wrong
  // workspace root; pin it to this app.
  turbopack: {
    root: __dirname,
  },

  experimental: {
    /**
     * Next's rewrite proxy times out at 30s by default and answers with a 500
     * (see node_modules/next/dist/server/lib/router-utils/proxy-request.js).
     *
     * POST /api/conversations/{id}/messages blocks for an entire local Ollama
     * run, which routinely passes 30s — a document-generating turn measured 31s
     * here and came back "Internal Server Error" even though the backend had
     * completed and committed the work. Raised to 30 minutes so a slow run is
     * reported as what it is. The schema rejects null, so this is a large
     * number rather than "no timeout".
     */
    proxyTimeout: 30 * 60 * 1000,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${BACKEND_URL}/health`,
      },
    ];
  },
};

export default nextConfig;
