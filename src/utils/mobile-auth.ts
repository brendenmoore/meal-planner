// Mobile auth seam (Capacitor 3, #4).
// Pure helpers + Supabase-backed token/fetch wrappers for the mobile bundle.
// Web path stays relative + cookie-session; mobile targets the hosted prod
// origin with a Bearer token (see src/utils/api.ts).

import { apiFetch } from "./api";
import { isMobileBuild } from "./mobile-build";
import { createClient } from "./supabase/client";

// Public routes mirror the server proxy gate (middleware.ts PUBLIC_PATHS):
// landing + login never redirect. Every other route is protected.
const PUBLIC_PATHS = new Set(["/", "/login"]);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

// Destination preserved for post-login return, mirroring the proxy gate's
// `?redirect=<pathname>`. Unsafe destinations fall back to /recipes, matching
// the login page's own safe-redirect check.
export function buildLoginRedirect(destination: string): string {
  const safe = destination.startsWith("/") && !destination.startsWith("//");
  const target = safe && destination !== "/login" ? destination : "/recipes";
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export type GuardDecision = {
  allow: boolean;
  redirectTo: string | null;
};

// Pure route-guard outcome: easily unit-tested without DOM or Supabase.
// - Web: always allow (server proxy gate owns auth; this guard is inert).
// - Mobile public route: allow.
// - Mobile protected route, signed in: allow.
// - Mobile protected route, logged out: redirect to login w/ destination.
export function resolveAuthGuard(args: {
  isMobile: boolean;
  pathname: string;
  hasSession: boolean;
}): GuardDecision {
  const { isMobile, pathname, hasSession } = args;
  if (!isMobile) {
    return { allow: true, redirectTo: null };
  }
  if (isPublicPath(pathname)) {
    return { allow: true, redirectTo: null };
  }
  if (hasSession) {
    return { allow: true, redirectTo: null };
  }
  return { allow: false, redirectTo: buildLoginRedirect(pathname) };
}

type SessionClient = {
  auth: {
    getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
  };
};

// Bearer token retrieval for the mobile bundle: reads the Supabase browser
// session. Returns null when logged out (or on web, where callers keep the
// cookie session and must not attach a header).
export async function getAccessToken(
  client?: SessionClient,
): Promise<string | null> {
  if (!isMobileBuild()) {
    return null;
  }
  const supabase = client ?? (createClient() as unknown as SessionClient);
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Authenticated caller for content screens: web behaves exactly like fetch
// (relative path, untouched init); mobile targets the prod origin and
// attaches `Authorization: Bearer <jwt>` when a session exists. An explicit
// accessToken override wins (tests, edge cases); otherwise the token is read
// from the Supabase browser session on mobile only.
export async function apiFetchWithAuth(
  path: string,
  init?: RequestInit,
  opts?: { accessToken?: string | null; supabaseClient?: SessionClient },
): Promise<Response> {
  if (!isMobileBuild()) {
    return apiFetch(path, init);
  }
  const token =
    opts?.accessToken !== undefined
      ? opts.accessToken
      : await getAccessToken(opts?.supabaseClient);
  return apiFetch(path, init, token ? { accessToken: token } : undefined);
}
