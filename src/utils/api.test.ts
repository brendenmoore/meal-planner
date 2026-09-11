import { afterEach, describe, expect, it, vi } from "vitest";

import { PROD_API_ORIGIN, apiFetch, resolveApiBaseUrl } from "./api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("resolveApiBaseUrl", () => {
  it("returns an empty string on web so calls stay relative", () => {
    vi.stubEnv("MOBILE_BUILD", "");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://example.com");

    expect(resolveApiBaseUrl()).toBe("");
  });

  it("returns the prod origin in the mobile bundle by default", () => {
    vi.stubEnv("MOBILE_BUILD", "1");

    expect(resolveApiBaseUrl()).toBe(PROD_API_ORIGIN);
    expect(PROD_API_ORIGIN).toBe("https://meals.bmoore.dev");
  });

  it("treats the public build flag as mobile (client bundles only inline NEXT_PUBLIC_*)", () => {
    vi.stubEnv("MOBILE_BUILD", "");
    vi.stubEnv("NEXT_PUBLIC_MOBILE_BUILD", "1");

    expect(resolveApiBaseUrl()).toBe(PROD_API_ORIGIN);
  });

  it("prefers NEXT_PUBLIC_API_BASE_URL when set in the mobile bundle", () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://staging.example.com");

    expect(resolveApiBaseUrl()).toBe("https://staging.example.com");
  });

  it("strips a trailing slash from the override so paths join cleanly", () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://staging.example.com/");

    expect(resolveApiBaseUrl()).toBe("https://staging.example.com");
  });

  it("uses the reserved test-env slot when configured in the mobile bundle", () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    vi.stubEnv("NEXT_PUBLIC_API_ENV", "test");
    vi.stubEnv(
      "NEXT_PUBLIC_API_TEST_BASE_URL",
      "https://test.example.com",
    );

    expect(resolveApiBaseUrl()).toBe("https://test.example.com");
  });

  it("falls back to normal resolution when the test slot is empty", () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    vi.stubEnv("NEXT_PUBLIC_API_ENV", "test");

    expect(resolveApiBaseUrl()).toBe(PROD_API_ORIGIN);
  });
});

describe("apiFetch", () => {
  function stubFetch() {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("passes web calls through unchanged (relative path, same init)", async () => {
    vi.stubEnv("MOBILE_BUILD", "");
    const fetchMock = stubFetch();
    const init = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Week 1" }),
    };

    await apiFetch("/api/meal-plans", init);

    expect(fetchMock).toHaveBeenCalledWith("/api/meal-plans", init);
  });

  it("never attaches an Authorization header on web, even with a token", async () => {
    vi.stubEnv("MOBILE_BUILD", "");
    const fetchMock = stubFetch();

    await apiFetch("/api/recipes", undefined, { accessToken: "token-123" });

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBeNull();
  });

  it("targets the prod origin in the mobile bundle without a token", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetch("/api/recipes");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://meals.bmoore.dev/api/recipes",
      undefined,
    );
  });

  it("attaches the Bearer token in the mobile bundle", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetch("/api/recipes", undefined, { accessToken: "token-123" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://meals.bmoore.dev/api/recipes");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer token-123",
    );
  });

  it("preserves method, body, and existing headers alongside the token", async () => {
    vi.stubEnv("MOBILE_BUILD", "1");
    const fetchMock = stubFetch();

    await apiFetch(
      "/api/meal-plans",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Week 1" }),
      },
      { accessToken: "token-123" },
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://meals.bmoore.dev/api/meal-plans");
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify({ name: "Week 1" }));
  });
});
