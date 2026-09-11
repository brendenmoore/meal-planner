// One API caller for the content screens (Capacitor 2, #3).
// Web keeps today's relative calls unchanged; the mobile bundle targets the
// hosted prod origin and attaches the user's Bearer token (see apiFetch).
import { isMobileBuild } from "./mobile-build";

export const PROD_API_ORIGIN = "https://meals.bmoore.dev";

// Reserved slot for a future test env: set NEXT_PUBLIC_API_ENV=test plus
// NEXT_PUBLIC_API_TEST_BASE_URL. Until then mobile resolves prod.
export function resolveApiBaseUrl(): string {
  if (!isMobileBuild()) {
    return "";
  }
  if (
    process.env.NEXT_PUBLIC_API_ENV === "test" &&
    process.env.NEXT_PUBLIC_API_TEST_BASE_URL
  ) {
    return stripTrailingSlash(process.env.NEXT_PUBLIC_API_TEST_BASE_URL);
  }
  return stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_BASE_URL ?? PROD_API_ORIGIN,
  );
}

function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/+$/, "");
}

// Token retrieval (Supabase browser session) lands in #4; until then callers
// pass the token explicitly, or omit it and behave exactly like fetch.
export function apiFetch(
  path: string,
  init?: RequestInit,
  opts?: { accessToken?: string | null },
): Promise<Response> {
  const base = resolveApiBaseUrl();
  const url = base ? `${base}${path}` : path;
  if (!base || !opts?.accessToken) {
    return fetch(url, init);
  }
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${opts.accessToken}`);
  return fetch(url, { ...init, headers });
}
