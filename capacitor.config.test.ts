import { describe, expect, it } from "vitest";

import config from "./capacitor.config";

// Static assertions on the Capacitor shell config (issue #5).
// External behavior only: identity, bundle dir, shell UX, release safety.
// Scheme registration in the native manifests is covered by
// `npm run verify:shell` (file presence, not unit-testable values).
describe("capacitor shell config", () => {
  it("uses a final-once-chosen reverse-DNS app id", () => {
    expect(config.appId).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i);
  });

  it("keeps the placeholder display name", () => {
    expect(config.appName).toBe("Meal Planner");
  });

  it("serves the mobile static-export bundle", () => {
    expect(config.webDir).toBe("out");
  });

  it("has no dev server url so releases bundle local files", () => {
    expect(config.server?.url).toBeUndefined();
  });

  it("configures splash, status-bar, and keyboard UX", () => {
    expect(config.plugins?.SplashScreen).toMatchObject({
      launchAutoHide: true,
    });
    expect(config.plugins?.StatusBar).toMatchObject({
      overlaysWebView: false,
    });
    expect(config.plugins?.Keyboard).toMatchObject({ resize: "body" });
  });
});
