// Verifies the dual-build matrix artifact shape (issue #2).
// Run after both builds: `npm run build:web && npm run build:mobile && npm run verify:build-matrix`
// Asserts external behavior only: artifact presence/absence per build.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const failures = [];

const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures.push(label);
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();

// Web build (.next): SSR server behavior intact.
check("web: .next/BUILD_ID exists", isFile(join(root, ".next", "BUILD_ID")));
check("web: .next/server exists (SSR routes)", isDir(join(root, ".next", "server")));

// Mobile build (out/): self-contained static bundle, no server behavior.
const mobilePages = [
  "index.html",
  "login.html",
  "recipes.html",
  "schedule.html",
  "shopping-list.html",
  "profile.html",
  "templates.html",
  "meal-plans.html",
];
for (const page of mobilePages) {
  check(`mobile: out/${page} exists`, isFile(join(root, "out", page)));
}
check("mobile: out/_next/static exists (self-contained assets)", isDir(join(root, "out", "_next", "static")));
check("mobile: out/api absent (no server routes)", !existsSync(join(root, "out", "api")));

const indexHtml = isFile(join(root, "out", "index.html"))
  ? readFileSync(join(root, "out", "index.html"), "utf8")
  : "";
check("mobile: index.html references local _next/static bundle", indexHtml.includes("_next/static"));

// The mobile build sets pageExtensions: ["tsx"] to exclude API routes, which
// is only safe while every .ts file under src/app is a route handler. Fail
// loudly if a shared .ts module appears there so it isn't silently dropped.
const nonRouteTs = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (entry.endsWith(".ts") && entry !== "route.ts") nonRouteTs.push(p);
  }
};
walk(join(root, "src", "app"));
if (nonRouteTs.length > 0) console.log(`  non-route .ts files: ${nonRouteTs.join(", ")}`);
check("mobile: every .ts file under src/app is an API route", nonRouteTs.length === 0);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nBuild matrix OK: web serves SSR from .next, mobile is static in out/.");
