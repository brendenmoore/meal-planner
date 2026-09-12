// Verifies the Capacitor shell shape (issue #5).
// Run after sync: `npm run cap:sync && npm run verify:shell`
// Asserts external behavior only: config values, scheme registration, and
// shell project presence. No assertions on component internals or native
// project XML/plists beyond existence of the registered values.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const failures = [];

const check = (label, cond) => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures.push(label);
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const read = (p) => (isFile(p) ? readFileSync(p, "utf8") : "");

// Capacitor config: identity + mobile bundle + shell UX, no dev server.
const configSrc = read(join(root, "capacitor.config.ts"));
check("shell: capacitor.config.ts exists", configSrc.length > 0);
const appId = (configSrc.match(/appId:\s*"([^"]+)"/) || [])[1] ?? "";
check(
  "shell: appId is reverse-DNS (final once chosen)",
  /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/i.test(appId),
);
check(
  'shell: webDir is "out" (mobile static-export bundle)',
  /webDir:\s*"out"/.test(configSrc),
);
check(
  "shell: no server.url in base config (release bundles local files)",
  !/server:\s*\{[^}]*url/.test(configSrc),
);
check("shell: SplashScreen plugin configured", /SplashScreen:\s*\{/.test(configSrc));
check(
  "shell: StatusBar does not overlay WebView (safe-area inset)",
  /overlaysWebView:\s*false/.test(configSrc),
);
check(
  "shell: Keyboard resizes the body (inputs stay visible)",
  /resize:\s*"body"/.test(configSrc),
);

// Native shell projects are checked in and openable in their tooling.
check("shell: ios/ project exists", isDir(join(root, "ios", "App")));
check(
  "shell: ios Xcode project exists",
  isDir(join(root, "ios", "App", "App.xcodeproj")),
);
check("shell: android/ project exists", isDir(join(root, "android", "app")));
check(
  "shell: android Gradle wrapper exists",
  isFile(join(root, "android", "gradlew")),
);

// App identity propagated to both shells.
const pbxproj = read(join(root, "ios", "App", "App.xcodeproj", "project.pbxproj"));
check(
  "shell: ios bundle id matches config appId",
  appId.length > 0 && pbxproj.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${appId};`),
);
const buildGradle = read(join(root, "android", "app", "build.gradle"));
check(
  "shell: android applicationId matches config appId",
  appId.length > 0 && buildGradle.includes(`applicationId "${appId}"`),
);

// mealplanner:// deep-link scheme reserved in both shells.
const manifest = read(join(root, "android", "app", "src", "main", "AndroidManifest.xml"));
check(
  "shell: android registers the mealplanner:// scheme",
  manifest.includes('android:scheme="mealplanner"'),
);
const infoPlist = read(join(root, "ios", "App", "App", "Info.plist"));
check(
  "shell: ios registers the mealplanner:// scheme",
  infoPlist.includes("CFBundleURLSchemes") && infoPlist.includes("<string>mealplanner</string>"),
);

const stringsXml = read(join(root, "android", "app", "src", "main", "res", "values", "strings.xml"));
check(
  "shell: android strings.xml scheme matches mealplanner",
  stringsXml.includes('<string name="custom_url_scheme">mealplanner</string>'),
);

// No template placeholder identity leaks into the android sources.
let staleRefs = [];
try {
  staleRefs = execSync("grep -rl 'com\\.getcapacitor\\.myapp\\|com\\.getcapacitor\\.app' android/app/src || true", {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch { /* grep absence is the passing case */ }
if (staleRefs.length > 0) console.log(`  stale placeholder refs: ${staleRefs.join(", ")}`);
check("shell: no placeholder package refs in android sources", staleRefs.length === 0);
const pkg = JSON.parse(read(join(root, "package.json")));
check(
  "shell: cap:sync rebuilds mobile and syncs the shell",
  typeof pkg.scripts?.["cap:sync"] === "string" &&
    pkg.scripts["cap:sync"].includes("build:mobile") &&
    pkg.scripts["cap:sync"].includes("cap sync"),
);

// Synced bundles boot from local files on both platforms.
check(
  "shell: ios boots bundled index.html",
  isFile(join(root, "ios", "App", "App", "public", "index.html")),
);
check(
  "shell: android boots bundled index.html",
  isFile(join(root, "android", "app", "src", "main", "assets", "public", "index.html")),
);

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nCapacitor shell OK: config + scheme + projects + sync pipeline.");
