# CONTEXT.md

## Glossary

- **Native install (v1)**: Internal-only distribution via TestFlight + Play Internal using a Capacitor shell. Not a public App Store / Play listing.
- **Capacitor shell**: Native iOS + Android wrapper serving the locally bundled static web build in a WebView. Both platforms from Day 1.
- **Dual-build**: Two Next.js builds from one `src/app` codebase. Web build stays SSR with proxy/middleware auth. Mobile build is a static export (`output: export`) copied into the Capacitor shell.
- **Offline v1**: View-only. Last-loaded meal plans / recipes readable from cache with no signal. Full offline create/edit + sync is deferred to the TanStack DB track.
- **Camera parity (v1)**: Existing `<input type="file">` image picker (`src/app/recipes/new/page.tsx:228`) keeps working as-is in the WebView. No new native camera plugin in v1. Push notifications explicitly deferred.
- **App identity (v1)**: Display name "Meal Planner" is placeholder and cheap to change. Bundle ID is final once chosen — changing it later equals a new app listing. Format must be reverse-DNS (e.g. `com.<owner>.mealplanner`).
- **API origin (v1)**: Mobile calls hosted prod origin via env-switched `NEXT_PUBLIC_API_BASE_URL`. No test env yet; design keeps a slot for one.
- **Auth (v1)**: Supabase email+password only (`src/app/login/page.tsx:46,69,88`). No OAuth / magic-link / MFA. Web keeps cookie SSR; mobile uses browser client token storage.
- **Native shells**: `ios/` + `android/` checked into git. `build:mobile && cap sync` script. Live-reload `serverUrl` dev-only.
- **Deep link (v1)**: Custom scheme `mealplanner://` reserved in both shells for auth callbacks (password-reset + future providers). `mealtime://` rejected as too generic / collision-prone — custom schemes have no central registry, uniqueness is by convention.
- **Token storage (v1)**: Supabase session in Capacitor `Preferences`. Hardening to encrypted storage before public launch.
- **Mobile API auth**: Mobile `fetch` sends `Authorization: Bearer <jwt>` to existing `/api/*` routes. No API rewrite.
- **Icons/signing (v1)**: Source 1024px PNG supplied by owner, generated via `@capacitor/assets`. Local signing for TestFlight + Play Internal; CI later.
