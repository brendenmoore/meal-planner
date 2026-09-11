import type { NextConfig } from "next";

// Dual-build matrix (ADR-0001):
// - Web (default): SSR with proxy auth + live API routes. `npm run build`
// - Mobile: static export bundled into the Capacitor shell. `npm run build:mobile`
// The mobile bundle cannot use server behavior (API routes, proxy/middleware,
// request-only APIs); it calls the hosted prod origin with a Bearer token.
// App code reads this flag via isMobileBuild() in src/utils/mobile-build.ts.
const isMobileBuild = process.env.MOBILE_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isMobileBuild
    ? {
        output: "export",
        images: { unoptimized: true },
        // Keep the mobile bundle out of the web build's `.next/` so each
        // build owns a separate directory: web -> `.next/`, mobile -> `out/`.
        // (With `output: "export"`, distDir is the final output directory.)
        distDir: "out",
        // API routes are server behavior: the mobile bundle calls the hosted
        // prod origin instead, so drop route.ts handlers from this build.
        // Every page/layout in src/app is .tsx; every .ts file is an API
        // route, so narrowing extensions excludes exactly the API routes.
        pageExtensions: ["tsx"],
      }
    : {}),
};

export default nextConfig;
