import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiFetchWithAuth,
  buildLoginRedirect,
  getAccessToken,
  isPublicPath,
  resolveAuthGuard,
} from "./mobile-auth";
import { PROD_API_ORIGIN } from "./api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function sessionClient(token: string | null) {
  return {
    auth: {
      getSession: async () => ({
        data: { session: token ? { access_token: token } : null },
      }),
    },
  };
}

describe("isPublicPath", () => {
  it("treats landing and login as public (mirrors the proxy gate)", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
  });

  it("treats content routes as protected", () => {
    expect(isPublicPath("/recipes")).toBe(false);
    expect(isPublicPath("/meal-plans")).toBe(false);
    expect(isPublicPath("/profile")).toBe(false);
  });
});

describe("buildLoginRedirect", () => {
  it("preserves the destination for post-login return", () => {
    expect(buildLoginRedirect("/recipes")).toBe("/login?redirect=%2Frecipes");
  });

  it("falls back for unsafe destinations, matching the login page", () => {
    expect(buildLoginRedirect("https://evil.example")).toBe(
      "/login?redirect=%2Frecipes",
    );
  });

  it("never redirects login to itself (avoids a loop)", () => {
    expect(buildLoginRedirect("/login")).toBe("/login?redirect=%2Frecipes");
  });
});

describe("resolveAuthGuard", () => {
  it("always allows on web (server proxy gate owns auth)", () => {
    expect(
      resolveAuthGuard({ isMobile: false, pathname: "/recipes", hasSession: false }),
    ).toEqual({ allow: true, redirectTo: null });
  });

  it("allows public routes in the mobile bundle while logged out", () => {
    expect(
      resolveAuthGuard({ isMobile: true, pathname: "/", hasSession: false }),
    ).toEqual({ allow: true, redirectTo: null });
    expect(
      resolveAuthGuard({ isMobile: true, pathname: "/login", hasSession: false }),
    ).toEqual({ allow: true, redirectTo: null });
  });

  it("passes signed-in users through to protected routes", () => {
    expect(
      resolveAuthGuard({ isMobile: true, pathname: "/recipes", hasSession: true }),
    ).toEqual({ allow: true, redirectTo: null });
  });

  it("redirects logged-out deep routes to login with destination preserved", () => {
    expect(
      resolveAuthGuard({ isMobile: true, pathname: "/recipes", hasSession: false }),
    ).toEqual({ allow: false, redirectTo: "/login?redirect=%2Frecipes" });
  });
});

describe("getAccessToken", () => {
  it("returns null on web without touching the session", async () => {
    vi.stubEnv("MOBILE_BUILD", "");
    const client = sessionClient("token-123");
    const spy = vi.spyOn(client.auth, "getSession");

    expect(await getAccessToken(client)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns the Supabase access token in the mobile bundle", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");

    expect(await getAccessToken(sessionClient("token-123"))).toBe("token-123");
  });

  it("returns null in the mobile bundle when logged out", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");

    expect(await getAccessToken(sessionClient(null))).toBeNull();
  });
});

describe("apiFetchWithAuth", () => {
  function stubFetch() {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("passes web calls through unchanged (relative path, same init)", async () => {
    vi.stubEnv("MOBILE_BUILD", "");
    const fetchMock = stubFetch();
    const init = { method: "POST", body: JSON.stringify({ name: "Week 1" }) };

    await apiFetchWithAuth("/api/recipes", init, { accessToken: "token-123" });

    expect(fetchMock).toHaveBeenCalledWith("/api/recipes", init);
  });

  it("targets the prod origin in the mobile bundle without a session", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetchWithAuth("/api/recipes", undefined, {
      supabaseClient: sessionClient(null),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PROD_API_ORIGIN}/api/recipes`);
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("attaches the Bearer token from the session in the mobile bundle", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetchWithAuth("/api/recipes", undefined, {
      supabaseClient: sessionClient("token-123"),
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${PROD_API_ORIGIN}/api/recipes`);
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer token-123",
    );
  });

  it("lets an explicit token override the session", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetchWithAuth("/api/recipes", undefined, {
      accessToken: "explicit",
      supabaseClient: sessionClient("session-token"),
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer explicit",
    );
  });
});
