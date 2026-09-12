# Meal Planner

## Build matrix (web + mobile)

One codebase, two builds (see `docs/adr/0001-capacitor-dual-build.md`):

| Build | Command | Output | Behavior |
| --- | --- | --- | --- |
| Web (default) | `npm run build:web` (or `npm run build`) | `.next/` | SSR with proxy/middleware auth and live `/api/*` routes |
| Mobile | `npm run build:mobile` | `out/` | Self-contained static export (unoptimized images, no API routes) for the Capacitor shell |

From a clean checkout:

```bash
npm ci
npm run build:web    # web build -> .next/
npm run build:mobile # mobile build -> out/
npm run verify:build-matrix # assert artifact shape of both builds
```

Notes:

- Build scripts assume a POSIX shell (`sh`/`zsh`); on Windows use WSL or Git Bash.
- Each build script wipes its own output dir first (`.next/` for web, `out/`
  for mobile). Note the mobile export also refreshes manifests inside `.next/`,
  so always run `build:web` again before `npm run start` after a mobile build.
- `build:mobile` sets `MOBILE_BUILD=1`, which switches `next.config.ts` to
  `output: "export"` with unoptimized images and excludes `src/app/api`
  route handlers (the mobile bundle calls the hosted prod origin instead).
  The flag is bridged into the bundle as `NEXT_PUBLIC_MOBILE_BUILD` because
  client code only inlines `NEXT_PUBLIC_*` vars; app code reads both via
  `isMobileBuild()`.
- Content screens call the API through `apiFetchWithAuth()` (`src/utils/mobile-auth.ts`,
  built on `apiFetch()` in `src/utils/api.ts`): relative paths with the cookie
  session on web, absolute prod origin (`https://meals.bmoore.dev`, overridable
  via `NEXT_PUBLIC_API_BASE_URL`) with a `Bearer` token from the Supabase
  browser session in the mobile bundle. Unit tests: `npm run test:unit`.
- The mobile bundle prerenders the public landing shell for server-authenticated
  surfaces (`/` and the navbar); `MobileAuthGuard`
  (`src/components/auth/MobileAuthGuard.tsx`) resolves the session at runtime —
  logged-out deep routes redirect to login with `?redirect=` preserved — and
  the web SSR path is unchanged.

## Native shell (Capacitor)

`capacitor.config.ts` + checked-in `ios/` and `android/` projects (see
`docs/adr/0001-capacitor-dual-build.md`):

- **Identity**: app id `dev.bmoore.meals` (reverse-DNS, final once set —
  changing it later equals a new app listing), display name "Meal Planner"
  (placeholder, cheap to change). The id is propagated to both shells
  (Xcode `PRODUCT_BUNDLE_IDENTIFIER`, Gradle `applicationId`).
- **Deep link**: custom scheme `mealplanner://` reserved in both shells
  (Android intent-filter + iOS `CFBundleURLTypes`) for auth callbacks; runtime
  handling via `@capacitor/app` lands with the reset flow.
- **Shell UX**: splash screen, non-overlay status bar (safe-area inset), and
  body-resizing keyboard so inputs stay visible.
- **Token storage**: `@capacitor/preferences` holds the Supabase session on
  device for v1 (encrypted-storage hardening deferred to pre-public).

From a clean checkout:

```bash
npm ci
npm run cap:sync   # build:mobile -> out/, then copy + update both shells
npm run verify:shell # assert config + scheme + projects + sync pipeline
npx cap open ios     # or: npm run cap:open:ios
npx cap open android # or: npm run cap:open:android
```

Notes:

- Release builds always bundle local files — the base config has no
  `server.url`. Dev-only live reload is CLI-transient and never persisted:
  `npx cap run ios --livereload --external` (or `android`) with `npm run dev`
  running.
- Synced web assets (`ios/App/App/public/`, `android/app/src/main/assets/`)
  are derived from `out/` and gitignored; the shell projects themselves are
  checked in. Re-run `npm run cap:sync` after every mobile build.
  `npm run cap:copy` re-copies without rebuilding (faster when `out/` is fresh).
- Branded icons/splash from the owner-supplied source image land in the
  follow-up ticket (#6).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
