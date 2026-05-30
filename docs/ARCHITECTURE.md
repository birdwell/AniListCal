# AniListCal Architecture

AniListCal is a full-stack web app that connects to [AniList](https://anilist.co) via OAuth, lets you browse and manage your anime list, and shows a weekly airing schedule for shows you are currently watching.

This document catalogs features, explains how the system is put together, and points to the code that implements each part.

---

## Table of contents

1. [System overview](#system-overview)
2. [Project structure](#project-structure)
3. [Runtime architecture](#runtime-architecture)
4. [Authentication](#authentication)
5. [API surface](#api-surface)
6. [Data flow and caching](#data-flow-and-caching)
7. [Features catalog](#features-catalog)
8. [Client architecture](#client-architecture)
9. [Server architecture](#server-architecture)
10. [GraphQL and code generation](#graphql-and-code-generation)
11. [Testing](#testing)
12. [Production and deployment](#production-and-deployment)
13. [Observability and security](#observability-and-security)
14. [Known gaps and tech debt](#known-gaps-and-tech-debt)
15. [References](#references)

---

## System overview

AniListCal uses a **Backend-for-Frontend (BFF)** pattern:

- The browser never receives AniList OAuth access tokens.
- The browser proves identity to our API with an **HttpOnly session cookie**.
- Authenticated AniList GraphQL calls go through **`POST /api/anilist/proxy`**, where the server attaches the stored Bearer token.

```
┌─────────────┐   cookie (sid)    ┌──────────────┐   Bearer token   ┌─────────────────┐
│   Browser   │ ────────────────► │  Express API │ ───────────────► │ AniList GraphQL │
│  React SPA  │ ◄──────────────── │  (BFF/proxy) │ ◄─────────────── │ graphql.anilist │
└─────────────┘   JSON responses  └──────┬───────┘                  └─────────────────┘
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                     Redis (prod)   node-persist    Vite/static
                     sessions       AniList tokens   client assets
```

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix) |
| Routing | [wouter](https://github.com/molefrog/wouter) |
| Server state | [TanStack React Query](https://tanstack.com/query) |
| Client UI state | [Zustand](https://github.com/pmndrs/zustand) (filters/search) |
| Backend | Express 4, TypeScript |
| Auth | Passport.js + express-session + OAuth2 |
| Session store | Redis (production) or in-memory (local dev) |
| Token storage | `node-persist` on disk (`.persist-storage/`) |
| External API | AniList GraphQL + OAuth 2.0 |
| Hosting | Railway (production) |

---

## Project structure

```
AniListCal/
├── client/                    # React SPA
│   ├── index.html             # HTML shell (Umami analytics script)
│   ├── public/                # Static assets
│   └── src/
│       ├── App.tsx            # Router, auth gate, theme provider
│       ├── main.tsx           # React entry, Sentry init
│       ├── pages/             # Route-level pages
│       ├── components/        # Feature + UI components
│       │   ├── home/          # List view, search, tag filters
│       │   ├── calendar/      # Weekly schedule UI
│       │   ├── show/          # Anime detail sections
│       │   └── ui/            # shadcn-style primitives
│       ├── hooks/             # Calendar, mutations, search, debounce
│       ├── lib/               # Auth client, AniList data layer, caching
│       ├── stores/            # Zustand stores
│       ├── queries/           # GraphQL documents (.graphql + compiled strings)
│       └── generated/         # GraphQL Codegen output (graphql.ts)
├── server/                    # Express backend
│   ├── index.ts               # Server entry point
│   ├── auth/                  # Passport, sessions, OAuth, requireAuth
│   ├── routes/                # Route registration, middleware, handlers
│   ├── storage.ts             # node-persist token/user storage
│   └── vite.ts                # Vite dev middleware + prod static serving
├── docs/
│   ├── ARCHITECTURE.md        # This file
│   └── adr/                   # Architecture decision records
├── schema.graphql             # Introspected AniList schema (codegen)
├── codegen.yml                # GraphQL Codegen config
├── dist/                      # Production build output (gitignored)
│   ├── index.js               # Bundled server
│   └── public/                # Built client assets
└── .persist-storage/          # Runtime AniList tokens (gitignored)
```

The repo uses a **single `package.json`** — client and server share dependencies and scripts. There is no yarn workspaces split.

---

## Runtime architecture

### Development

```bash
yarn dev   # nodemon → tsx server/index.ts
```

1. Express starts on port **5001** (or `PORT`).
2. `registerRoutes()` mounts middleware, sessions, and API routes **before** the SPA handler.
3. In non-production mode, `setupVite()` attaches Vite in middleware mode to the same HTTP server.
4. Requests to `/api/*` hit Express handlers; all other requests get the SPA (`client/index.html` transformed by Vite).
5. On startup, the server optionally opens the system browser to `/login` (disable with `OPEN_BROWSER=false`).

OAuth redirects require a real browser (Chrome, Safari, Firefox). Embedded IDE previews block AniList redirects.

### Production

```bash
yarn build   # vite build + esbuild server bundle
yarn start   # node dist/index.js
```

1. `vite build` outputs static assets to `dist/public/`.
2. `esbuild` bundles `server/index.ts` → `dist/index.js` (ESM, Node packages external).
3. `serveStatic()` serves `dist/public/`; unknown non-API paths fall through to `index.html` for client-side routing.

### Frontend-only dev (optional)

```bash
yarn client   # standalone Vite on port 5001
```

Useful for UI-only work. Full-stack development should use `yarn dev` only.

### Entry points

| Role | File |
|------|------|
| Server | `server/index.ts` |
| Client | `client/src/main.tsx` → `client/src/App.tsx` |
| Route registration | `server/routes/index.ts` |

---

## Authentication

Full decision record: [docs/adr/001-passport-session-auth.md](./adr/001-passport-session-auth.md).

### Design principles

| Concern | Approach |
|---------|----------|
| Browser ↔ API identity | HttpOnly cookie `sid`, `credentials: "include"` on all auth fetches |
| AniList access tokens | Stored server-side only in `node-persist`; never sent to the browser |
| OAuth flow | Server-side redirect via Passport strategy named **`anilist`** |
| Session persistence (prod) | Redis via `connect-redis` when `REDIS_URL` is set |
| Session persistence (dev) | In-memory `memorystore` when `REDIS_URL` is unset |
| Token expiry | Revoke stored token, destroy session, return `401` with `ANILIST_TOKEN_EXPIRED` |

### OAuth sequence

```mermaid
sequenceDiagram
  participant Browser
  participant AniListCal
  participant Redis
  participant AniList

  Browser->>AniListCal: GET /api/auth/login
  AniListCal->>Browser: 302 to AniList authorize URL
  Browser->>AniList: User approves
  AniList->>Browser: 302 to /api/auth/callback?code=...
  Browser->>AniListCal: GET /api/auth/callback
  AniListCal->>AniList: Exchange code for access token (JSON body)
  AniListCal->>AniList: Fetch Viewer profile (GraphQL)
  AniListCal->>AniListCal: Persist token + user in node-persist
  AniListCal->>Redis: Save session (user id)
  AniListCal->>Browser: Set-Cookie sid; redirect to /
  Browser->>AniListCal: POST /api/anilist/proxy (cookie)
  AniListCal->>AniList: GraphQL with stored access token
```

### Key server files

| File | Responsibility |
|------|----------------|
| `server/auth/anilistStrategy.ts` | Passport OAuth2 strategy (must be named `anilist`) |
| `server/auth/anilistOAuth.ts` | Token exchange, viewer fetch, login completion |
| `server/auth/anilistCallback.ts` | OAuth callback handler |
| `server/auth/passport.ts` | Serialize/deserialize user (id only; reload token from storage) |
| `server/auth/session.ts` | Redis or memory session store setup |
| `server/auth/sessionConfig.ts` | Cookie name, max age, secure flags |
| `server/auth/requireAuth.ts` | Middleware: session check + load AniList token onto `req` |
| `server/auth/clearSession.ts` | Token expiry detection and session teardown |
| `server/storage.ts` | `node-persist` read/write for tokens and user info |

### Key client files

| File | Responsibility |
|------|----------------|
| `client/src/lib/auth/index.ts` | `login()`, `logout()`, `getUser()`, `queryAniList()` (proxy client) |
| `client/src/App.tsx` | `ProtectedRoute` — redirects unauthenticated users to `/login` |

### AniList OAuth quirks

- Token exchange expects a **JSON body** (`grant_type`, `client_id`, `client_secret`, `redirect_uri`, `code`), not form-urlencoded. Custom exchange lives in `server/auth/anilistOAuth.ts`.
- AniList access tokens last ~1 year and **do not provide refresh tokens**.
- The Passport strategy must set `strategy.name = "anilist"` because routes call `passport.authenticate("anilist")`.

### Redirect URIs

| Environment | URI |
|-------------|-----|
| Local | `http://localhost:5001/api/auth/callback` |
| Production | `https://anilistcal.com/api/auth/callback` (or your domain) |

Register these at https://anilist.co/settings/developer.

---

## API surface

All routes are registered in `server/routes/auth.ts` and `server/routes/config.ts`, wired through `server/routes/index.ts`.

### Middleware (applied globally before routes)

From `server/routes/middleware.ts`:

- CORS (production: allow `FRONTEND_URL` origin; dev: permissive)
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, CSP on non-API routes in prod)
- Rate limiting: 100 req / 15 min on `/api/` (skipped in dev except health); 10 req / hr on `/api/auth/` (prod only)
- `express-session` + `passport.initialize()` + `passport.session()`

### Routes

| Method | Path | Auth | Handler | Purpose |
|--------|------|------|---------|---------|
| GET | `/api/health` | No | inline | Health check — `{ "status": "ok" }` |
| GET | `/api/auth/session` | No | `sessionHandler` | Lightweight logged-in check |
| GET | `/api/auth/login` | No | Passport | Start OAuth redirect |
| GET | `/api/auth/callback` | No | `anilistCallback` | Complete OAuth, set session cookie |
| GET | `/api/auth/user` | Yes | `getUserHandler` | Current user profile from storage |
| POST | `/api/auth/logout` | No* | `logoutHandler` | Revoke AniList token + destroy session |
| POST | `/api/anilist/proxy` | Yes | `proxyHandler` | Forward GraphQL to AniList with stored token |

\*Logout works with or without an active session.

### `requireAuth` middleware

Applied to `/api/anilist/*` and `/api/auth/user`:

1. Requires `req.isAuthenticated()` and a Passport user.
2. Loads the AniList access token from `node-persist`.
3. Sets `req.userId` and `req.anilistToken` for downstream handlers.

If the token is missing or AniList rejects it, the session is cleared and the client receives a `401` with code `ANILIST_TOKEN_EXPIRED`.

---

## Data flow and caching

### Two GraphQL paths

```
Authenticated (user-specific data):
  Browser → queryAniList() → POST /api/anilist/proxy → AniList GraphQL

Public (no auth required):
  Browser → graphql-request → https://graphql.anilist.co (direct)
```

| Operation | Path | Function |
|-----------|------|----------|
| User anime list | Proxy | `fetchUserAnime()` in `client/src/lib/anilist.ts` |
| Authenticated show details (includes list entry) | Proxy | `fetchAuthenticatedAnimeDetails()` |
| Current user (`Viewer`) | Proxy | `getUser()` in `client/src/lib/auth/index.ts` |
| Progress / status mutations | Proxy | `useUpdateProgress`, `useUpdateStatus` hooks |
| Public show details (unauthenticated fallback) | Direct | `fetchAnimeDetails()` |

The server proxy (`server/routes/handlers/proxyHandler.ts`) forwards `{ query, variables }` with the stored Bearer token and handles AniList auth failures.

### Caching layers

| Layer | Location | Behavior |
|-------|----------|----------|
| React Query | `client/src/lib/queryClient.ts` | Default stale 5 min, gc 30 min; pages override via `commonQueryOptions` |
| localStorage | `client/src/lib/cache-service.ts` | Anime list: 30 min TTL; details: 24 hr TTL; LRU eviction (10 list / 30 detail entries) |
| Server | — | No GraphQL response cache; tokens cached in `node-persist` with ~1 year TTL |
| Session | Redis / memory | Session cookie references user id; token loaded on each authenticated request |

Mutations call `clearAnimeListCache()` after success to invalidate the localStorage list cache. React Query keys are invalidated by mutation hooks where needed.

---

## Features catalog

### Login (`/login`)

**Files:** `client/src/pages/login.tsx`

- Public landing with AniList OAuth sign-in button.
- Redirects authenticated users to `/`.
- Displays OAuth error messages from `?error=` query param.
- Explains that OAuth must run in a real browser, not an embedded preview.

### Home — anime list (`/`)

**Files:** `client/src/pages/home.tsx`, `client/src/components/home/*`

The main dashboard for your AniList library.

| Feature | How it works |
|---------|--------------|
| **Data source** | Fetches `Viewer` via OAuth, then loads anime list (CURRENT, PAUSED, PLANNING) through the GraphQL proxy |
| **Sections** | Collapsible groups: Currently Airing, Watching, On Hold, Plan to Watch |
| **View modes** | Compact list vs grid card layout (`ViewToggle`) |
| **Search** | Fuzzy search across titles, genres, studios (`useFuzzySearch` + debounced query from Zustand) |
| **Tag filters** | Filter by AniList genres and tags; AND logic (all selected tags must match). Collapsible panel with category grouping and inline search |
| **Episode controls** | Inline +/- buttons on cards to update watch progress without leaving the list |
| **Navigation** | Click a card → `/show/:id` |

**Filtering pipeline** (in `AnimeContent.tsx`):

1. Fuzzy search on title/metadata
2. Tag filter (genres + tags, all must match)
3. Status filter into section buckets

Currently airing shows are entries with a `nextAiringEpisode` regardless of which status section they also appear in.

### Calendar — weekly schedule (`/calendar`)

**Files:** `client/src/pages/calendar.tsx`, `client/src/hooks/useCalendar.ts`, `client/src/components/calendar/*`

An in-app view of what's airing over the next 7 days.

| Feature | How it works |
|---------|--------------|
| **Day selector** | 7-day rolling view starting from today; day tabs ordered from today's weekday |
| **Show grouping** | `groupShowsByAiringDate()` maps CURRENT entries with `nextAiringEpisode` to calendar dates |
| **Weekly show logic** | `isWeeklyShow()` duplicates weekly series onto "today" when the next episode airs on the same weekday within the week (so you see what to watch today, not just the next future episode date) |
| **Episode display** | `useEpisodeDisplay` shows the episode that aired today (or the previous episode for weekly shows on airing day) |
| **Inline tracking** | Episode +/- controls on each show card |
| **Empty state** | "No shows airing on {day}" when nothing is scheduled |

**Note:** This is an in-app schedule viewer. There is currently no ICS export or external calendar sync (Google Calendar, Apple Calendar, etc.) despite the product name and login copy referencing "calendar events."

### Show detail (`/show/:id`)

**Files:** `client/src/pages/show.tsx`, `client/src/components/show/*`

Full anime detail page with list management.

| Section | Content |
|---------|---------|
| **Hero** | Cover image, title, status badge |
| **Details** | Synopsis, format, episodes, season, studio, metrics (score, popularity, rankings) |
| **Episode tracking** | Status selector, episode progress controls, next airing info (if in list) |
| **Add to list** | Dropdown to add with a status (if not yet in list) |
| **Characters** | Character grid with voice actors |
| **Tags** | Genres and AniList tags |
| **Relations** | Prequels, sequels, side stories |
| **Recommendations** | Related anime suggestions |
| **External links** | AniList, streaming, social links |

Uses `fetchAuthenticatedAnimeDetails()` so the response includes `mediaListEntry` for the logged-in user. Refetches on window focus (`staleTime: 0`).

### Profile (`/profile`)

**Files:** `client/src/pages/profile.tsx`

Displays OAuth-connected user info (name, AniList ID).

**Current limitations:**

- Connect/Disconnect buttons are no-ops (`onClick={() => { }}`).
- A manual "Anilist User ID" form calls `PATCH /api/users/:id`, which **does not exist** on the server. User identity comes entirely from OAuth; this is legacy UI.

Logout is available from the nav bar (`Layout`) and works correctly.

### Episode progress updates

**Files:** `client/src/components/episode-controls.tsx`, `client/src/hooks/useUpdateProgress.ts`

- Optimistic local UI while the mutation runs.
- Calls `SaveMediaListEntry` GraphQL mutation via the proxy.
- Clears anime list localStorage cache on success.
- Used on home cards, calendar cards, and show detail page.

### Status updates

**Files:** `client/src/components/status-selector.tsx`, `client/src/components/show/add-to-list-button.tsx`, `client/src/hooks/useUpdateStatus.ts`

- Change list status (Watching, Completed, Paused, Dropped, Planning).
- Optimistic React Query cache updates + toast notifications.
- Add-to-list button for shows not yet in the user's library.

### Theme (light / dark / system)

**Files:** `client/src/components/theme-provider.tsx`, `client/src/components/theme-toggle.tsx`

- Supports `light`, `dark`, and `system` (follows OS preference).
- Persisted to `localStorage` key `anime-tracker-theme`.
- Toggle in the nav bar switches between resolved light and dark.

### Layout and navigation

**Files:** `client/src/components/layout.tsx`

Fixed top nav with links to Home, Calendar, Profile, plus theme toggle and logout. Hidden on `/login` and `/auth-error`.

---

## Client architecture

### Routing

Router: **wouter** in `client/src/App.tsx`.

| Path | Page | Auth |
|------|------|------|
| `/login` | Login | Public |
| `/auth-error` | Inline error card | Public |
| `/` | Home | Protected |
| `/calendar` | Calendar | Protected |
| `/profile` | Profile | Protected |
| `/show/:id` | Show detail | Protected |
| (fallback) | Not found | — |

`ProtectedRoute` wraps authenticated pages. It fetches the user via React Query (`getUser()`), shows a spinner while loading, and redirects to `/login` (with error message for token expiry).

### State management

**React Query** — primary server-state layer:

| Query key | Data |
|-----------|------|
| `["auth", "user"]` | Current user (auth gate) |
| `["/api/users/current"]` | Same user fetch (legacy key, used on home/profile) |
| `["/anilist/anime", userId]` | User's anime list |
| `["/anilist/anime", mediaId]` | Single anime details |

Shared client: `client/src/lib/queryClient.ts`. Config helpers: `client/src/lib/query-config.ts`.

**Zustand** — client UI filter state (`client/src/stores/filterStore.ts`):

- `searchQuery` — debounced fuzzy search input
- `selectedTags` — active tag/genre filters
- Actions: `setSearchQuery`, `addTag`, `removeTag`, `clearTags`

**Local component state** — section collapse, compact/grid toggle, tag filter panel open/closed.

### Component organization

| Directory | Purpose |
|-----------|---------|
| `components/home/` | List view: sections, search, tags, cards |
| `components/calendar/` | Day selector, show cards, episode info |
| `components/show/` | Detail page sections (hero, characters, metrics, etc.) |
| `components/ui/` | Reusable shadcn-style primitives (Button, Card, Dialog, etc.) |
| `components/anime-card.tsx` | Shared anime card used on home |
| `components/episode-controls.tsx` | Shared progress +/- widget |
| `components/status-selector.tsx` | Shared status dropdown |

---

## Server architecture

### Request lifecycle

```
HTTP request
  → express.json / urlencoded
  → request logging (API paths only)
  → CORS + security headers
  → rate limiting
  → express-session (Redis or memory)
  → passport.session()
  → /api/* route handler (or Vite/static for SPA)
  → error handler (500 JSON)
```

### Token storage

`server/storage.ts` uses `node-persist` with files under `.persist-storage/`:

| Key pattern | Content |
|-------------|---------|
| `anilist_token_{userId}` | Access token + expiry metadata |
| `user_info_{userId}` | Username, avatar URL |

Expired tokens are cleaned up on an hourly interval. On ephemeral containers (Railway), this directory is **lost on redeploy** unless a persistent volume is mounted. Redis sessions survive redeploys; AniList tokens may not.

### Vite integration

`server/vite.ts`:

- **Dev:** Vite middleware mode on the shared HTTP server; SPA fallback transforms `client/index.html`.
- **Prod:** Serves `dist/public/` with SPA fallback to `index.html`.

API routes are always registered before Vite/static middleware so `/api/*` never hits the SPA handler.

---

## GraphQL and code generation

GraphQL documents live in `client/src/queries/` (`.graphql` files and compiled strings in `queries.ts`).

```bash
yarn generate   # GraphQL Codegen
```

Config: `codegen.yml`

- Schema introspected from `https://graphql.anilist.co`
- Types generated to `client/src/generated/graphql.ts`
- Schema snapshot saved to `schema.graphql`

Run `yarn generate` after changing `.graphql` query files.

Key operations (`client/src/queries/queries.ts`):

| Operation | Used for |
|-----------|----------|
| `GetUserMediaList` | Home list, calendar data |
| `GetMedia` | Show detail page |
| `SaveMediaListEntry` | Progress and status mutations |

---

## Testing

**Runner:** Vitest (`vitest.config.ts`) — jsdom environment, `@/` path alias.

```bash
yarn test            # run all tests
yarn test:watch      # watch mode
yarn test:coverage   # coverage report
```

### Server tests

| File | Coverage |
|------|----------|
| `server/__tests__/session.test.ts` | Session cookie config, max age, secure flags |
| `server/__tests__/storage.test.ts` | Token/user CRUD, expiry |
| `server/__tests__/anilistOAuth.test.ts` | Token exchange, viewer fetch |
| `server/__tests__/anilistStrategy.test.ts` | Strategy name and OAuth wiring |
| `server/__tests__/clearSession.test.ts` | AniList auth failure detection |
| `server/routes/handlers/__tests__/proxyHandler.test.ts` | Proxy auth, 401 expiry path |
| `server/routes/handlers/__tests__/getUserHandler.test.ts` | Authenticated user handler |
| `server/routes/handlers/__tests__/logoutHandler.test.ts` | Token revoke + session destroy |

### Client tests

| File | Coverage |
|------|----------|
| `client/src/lib/auth/__tests__/auth.test.ts` | Login redirect, session check, logout, proxy errors |
| `client/src/__tests__/calendar.test.ts` | `groupShowsByAiringDate`, `getDayName` |
| `client/src/__tests__/useCalendar.test.tsx` | Calendar hooks |
| `client/src/components/calendar/__tests__/ShowsList.test.tsx` | ShowsList rendering |

### Not yet covered

See `todo.md` for planned test work:

- Full OAuth flow integration tests (supertest + cookie jar)
- `ProtectedRoute` / `App.tsx` component tests
- E2E login flow (Playwright/Cypress)
- Tag filter store and UI tests

---

## Production and deployment

Hosted on **Railway**. Config: `railway.toml`.

| Setting | Value |
|---------|-------|
| Build | `yarn build` |
| Start | `yarn start` |
| Health check | `GET /api/health` (120s timeout) |
| Restart policy | ON_FAILURE |

### Required environment variables

```env
NODE_ENV=production
ANILIST_CLIENT_ID=...
ANILIST_CLIENT_SECRET=...
SESSION_SECRET=...          # long random string
REDIS_URL=redis://...       # sessions survive redeploys
FRONTEND_URL=https://anilistcal.com
BACKEND_CALLBACK_URL=https://anilistcal.com/api/auth/callback
```

Do **not** set `PORT` on Railway — the platform injects it.

See also: [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md), [.env.production.example](../.env.production.example), [AGENTS.md](../AGENTS.md).

### Build artifacts

| Output | Source |
|--------|--------|
| `dist/index.js` | esbuild bundle of `server/index.ts` |
| `dist/public/` | Vite client build |

---

## Observability and security

### Error monitoring

- **Client:** Sentry initialized in `client/src/main.tsx` (`@sentry/react`).
- **Server:** No Sentry integration currently.

### Analytics

Umami script loaded in `client/index.html`. Allowed in production CSP (`connect-src`, `script-src`).

### Security measures

| Measure | Implementation |
|---------|----------------|
| HttpOnly session cookies | `server/auth/sessionConfig.ts` |
| Secure cookies in production | `secure: true` when `NODE_ENV=production` |
| Rate limiting | `express-rate-limit` on `/api/` and `/api/auth/` |
| CSP | Production non-API routes (`server/routes/middleware.ts`) |
| CORS | Restricted to `FRONTEND_URL` in production |
| Token isolation | AniList tokens never leave the server |
| Trust proxy | `app.set("trust proxy", 1)` for Railway reverse proxy |

### Logging

- Server: structured logging via `server/logger.ts` (loglevel); API request/response summaries in `server/index.ts`.
- Client: `client/src/lib/logger.ts` (loglevel, debug-level in dev).

---

## Known gaps and tech debt

| Item | Details |
|------|---------|
| **No external calendar export** | Product name and login copy mention "calendar events," but there is no ICS download or calendar subscription URL |
| **Stale profile page** | Dead Connect/Disconnect buttons; form calls non-existent `PATCH /api/users/:id` |
| **Legacy query keys** | `["/api/users/current"]` references a removed REST users API; identity is OAuth-only |
| **Duplicate QueryClientProvider** | `main.tsx` wraps `App` in a provider that duplicates the one inside `App.tsx` |
| **Token persistence on deploy** | `.persist-storage/` is ephemeral on Railway unless a volume is mounted; users may need to re-login after redeploy even with Redis sessions |
| **Tag filter tests/polish** | Listed in `todo.md` — filter store and collapsible UI need tests and styling pass |
| **No server-side Sentry** | Client errors are tracked; server/proxy errors are log-only |
| **Timezone display** | Airing times use local `Date`; AniList exposes user timezone but it is not surfaced in the UI |

---

## References

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Getting started |
| [AGENTS.md](../AGENTS.md) | Dev setup, env vars, Railway notes |
| [docs/adr/001-passport-session-auth.md](./adr/001-passport-session-auth.md) | Auth architecture decision |
| [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) | Pre/post deploy verification |
| [todo.md](../todo.md) | Planned follow-ups |
| [tags.md](../tags.md) | AniList tag reference for filter categories |
