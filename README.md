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
- Content screens call the API through `apiFetch()` (`src/utils/api.ts`):
  relative paths with the cookie session on web, absolute prod origin
  (`https://meals.bmoore.dev`, overridable via `NEXT_PUBLIC_API_BASE_URL`)
  with a `Bearer` token in the mobile bundle. Unit tests: `npm run test:unit`.
- The mobile bundle prerenders the public landing shell for server-authenticated
  surfaces (`/` and the navbar); the client-side auth guard arrives in a
  follow-up ticket and the web SSR path is unchanged.

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
