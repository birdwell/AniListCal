# ADR 001: Passport + express-session authentication

**Status:** Accepted  
**Date:** 2026-05-27  
**Epic:** [#22 Migrate auth to Passport + express-session](https://github.com/birdwell/AniListCal/issues/22)

## Context

AniListCal originally used a **custom BFF token layer**:

- After OAuth, the server minted an internal API token and returned it to the browser (URL hash / client storage).
- The client sent `Authorization: Bearer <apiToken>` on API calls.
- A `/api/auth/refresh-token` endpoint tried to keep sessions alive.

Problems with that approach:

- Tokens in client storage are easier to exfiltrate than HttpOnly cookies.
- We maintained bespoke token generation, validation, and refresh logic without meaningful benefit.
- AniList OAuth access tokens last ~1 year and **do not provide refresh tokens**, so a “refresh” endpoint could not truly refresh AniList credentials.
- Session state was split between client-held API tokens and server-held AniList tokens.

The app already used a **BFF/proxy pattern** (browser → our API → AniList GraphQL). The migration keeps that boundary and replaces only how the browser proves identity to our API.

## Decision

Adopt **Passport.js + express-session** with **HttpOnly session cookies**:

| Layer | Choice |
|-------|--------|
| Browser ↔ AniListCal API | HttpOnly cookie `sid` (`credentials: "include"`) |
| Session store (production) | Redis via `connect-redis` (`REDIS_URL`) |
| Session store (local dev) | In-memory (`memorystore`) when `REDIS_URL` is unset |
| OAuth | `passport-oauth2` strategy named **`anilist`** (server-side redirect flow) |
| AniList tokens | Stored server-side only (Redis in production, `node-persist` locally), never exposed to the browser |
| AniList token expiry | Revoke stored token, destroy session, return `401` with `ANILIST_TOKEN_EXPIRED` |

### Auth flow (current)

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
  AniListCal->>AniListCal: Persist token + user in Redis (or node-persist locally)
  AniListCal->>Redis: Save session (user id)
  AniListCal->>Browser: Set-Cookie sid; redirect to /
  Browser->>AniListCal: POST /api/anilist/proxy (cookie)
  AniListCal->>AniList: GraphQL with stored access token
```

### Key routes

| Route | Purpose |
|-------|---------|
| `GET /api/auth/login` | Start OAuth (Passport redirect) |
| `GET /api/auth/callback` | Complete OAuth, establish session |
| `GET /api/auth/session` | Lightweight “logged in?” check |
| `GET /api/auth/user` | Current user profile (requires session) |
| `POST /api/auth/logout` | Revoke AniList token + destroy session |
| `POST /api/anilist/proxy` | Authenticated GraphQL proxy |

**Removed:** `/api/auth/refresh-token`, SPA hash token callback, internal API token storage, client `localStorage` / Bearer auth to our API.

## Implementation notes

### AniList OAuth quirks

- Token exchange expects **JSON** (`grant_type`, `client_id`, `client_secret`, `redirect_uri`, `code`), not form-urlencoded. Custom exchange lives in `server/auth/anilistOAuth.ts` and is wired into the strategy via a patched `getOAuthAccessToken`.
- `passport-oauth2` registers strategies with the default name `oauth2`. Routes call `passport.authenticate("anilist")`, so the strategy must set `strategy.name = "anilist"` after construction (fix in commit `59c0a43`).

### Session cookie

- Name: `sid`
- `httpOnly: true`, `sameSite: "lax"`, `secure: true` in production
- Max age ~364 days (configurable via `SESSION_MAX_AGE_MS`)
- `app.set("trust proxy", 1)` for Railway/reverse proxies

### Persistence split

| Data | Store | Survives deploy? |
|------|-------|------------------|
| Session id → user id | Redis (prod) | Yes, when `REDIS_URL` is set |
| AniList access token + profile | Redis when `REDIS_URL` is set; else `node-persist` (`.persist-storage/`) | Yes with Redis |

Users may need to re-authorize with AniList after a deploy only when `REDIS_URL` is unset (tokens fall back to ephemeral disk). With Redis configured, sessions and AniList tokens both survive deploys.

## Environment variables

**Required (local + production):**

```env
ANILIST_CLIENT_ID=...
ANILIST_CLIENT_SECRET=...
SESSION_SECRET=...
```

**Required (production):**

```env
REDIS_URL=redis://...
FRONTEND_URL=https://anilistcal.com
BACKEND_CALLBACK_URL=https://anilistcal.com/api/auth/callback
```

**No longer required:** `VITE_ANILIST_CLIENT_ID` (old client-side OAuth redirect).

**Not used:** `DATABASE_URL` — Postgres is not part of auth; tokens use Redis (production) or `node-persist` (local dev).

## Production deployment (Railway)

1. Redis add-on → set `REDIS_URL` on the **app service** (not only the Redis service).
2. Set `SESSION_SECRET`, AniList credentials, `FRONTEND_URL`, `BACKEND_CALLBACK_URL`.
3. Do **not** set `PORT` (Railway injects it).
4. AniList redirect URI: `https://anilistcal.com/api/auth/callback`.

## Consequences

### Positive

- Browser never sees AniList or internal API tokens.
- Standard, well-understood session + OAuth stack.
- Redis-backed sessions survive restarts and deploys.
- Clear 401 path when AniList rejects a stored token (`ANILIST_TOKEN_EXPIRED`).

### Negative / trade-offs

- Production **requires Redis** for durable login sessions.
- AniList tokens on container disk remain ephemeral without Redis; set `REDIS_URL` in production so tokens persist alongside sessions.
- OAuth login must run in a real browser (not Cursor embedded preview).
- Slightly more moving parts (Passport, Redis, session middleware) than the old custom tokens.

## Related commits

- `5da42b0` — Full migration to Passport session cookies + Redis
- `59c0a43` — Fix strategy name (`anilist` vs default `oauth2`)

## Related issues

- #23 Redis session store
- #24 Passport + AniList OAuth strategy
- #25 requireAuth middleware
- #26 Client cookie auth
- #27 AniList token expiry handling
- #28 Tests and docs
