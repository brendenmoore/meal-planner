# Capacitor dual-build: SSR web + static-export mobile shell

Web stays SSR with proxy/middleware cookie auth; mobile ships as a static export (`output: export`) served from a Capacitor iOS + Android shell for internal TestFlight + Play Internal distribution.

## Considered Options

- Single static export for both web and mobile: rejected — guts web SSR, middleware auth, and `/api/*` routes.
- Fully native rewrite: rejected — cost without benefit for an internal v1.
- PWA only: rejected — goal is store-distributed installable.

## Consequences

- Mobile bundle cannot use API routes, proxy/middleware, or request-only APIs (`cookies()`); it calls the hosted prod origin with `Authorization: Bearer <jwt>` and guards auth client-side.
- Offline v1 is view-only; full sync deferred to the TanStack DB track.
