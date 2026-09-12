import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor shell (issue #5, ADR-0001).
// - appId is final once chosen (changing it later equals a new app listing);
//   display name "Meal Planner" is placeholder and cheap to change.
// - webDir is the mobile static-export output (npm run build:mobile -> out/).
//   Release builds always bundle these local files: there is intentionally no
//   `server.url` here. Live reload is CLI-transient only
//   (npx cap run ios|android --livereload --external) and never persisted.
// - The `mealplanner://` custom URL scheme (auth callbacks) is registered in
//   the native shells (AndroidManifest.xml intent-filter + Info.plist
//   CFBundleURLTypes), not here: this config has no webview-scheme override
//   so both platforms keep the default secure https webview scheme.
const config: CapacitorConfig = {
  appId: "dev.bmoore.meals",
  appName: "Meal Planner",
  webDir: "out",
  plugins: {
    SplashScreen: {
      // Branded launch screen until the icon/splash pipeline (#6) lands;
      // colors match the app's dark default theme.
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0c1017",
      showSpinner: false,
    },
    StatusBar: {
      // Do not draw under the status bar: content stays inset (safe-area).
      overlaysWebView: false,
      backgroundColor: "#0c1017",
    },
    Keyboard: {
      // Resize the WebView body so the keyboard never covers inputs;
      // resizeOnFullScreen keeps that true on Android edge-to-edge.
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
