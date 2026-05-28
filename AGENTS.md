# AGENTS.md

Guidance for AI agents and developers working on AniListCal.

## Local development

```bash
yarn install
cp .env.example .env   # first time only; fill in AniList credentials
yarn dev
```

- **One command** — Express serves API + Vite on **http://localhost:5001**
- Browser opens to `/login` automatically (disable with `OPEN_BROWSER=false` in `.env`)
- Use **Chrome/Safari/Firefox** for OAuth — Cursor’s embedded preview blocks AniList redirects

`yarn client` exists for frontend-only Vite work; normal full-stack dev uses **`yarn dev`** only.

## Environment variables

**File:** `.env` in the project root (gitignored). Template: `.env.example`.

**Required for local login:**

```env
ANILIST_CLIENT_ID=...
ANILIST_CLIENT_SECRET=...
SESSION_SECRET=...           # any long random string
```

Login uses **`GET /api/auth/login`** (server OAuth + session cookie). `VITE_ANILIST_CLIENT_ID` is **not required** — it was only used for the old client-side OAuth redirect.

**Not used:** `DATABASE_URL` — persistence is `node-persist` (`.persist-storage/`) for AniList OAuth tokens, not Postgres.

**Sessions:**

- Local dev: in-memory sessions by default (no Redis required).
- Production: set **`REDIS_URL`** (Railway Redis add-on) so login sessions survive deploys/restarts.
- Optional **`SESSION_MAX_AGE_MS`** — default ~364 days (slightly under AniList’s 1-year access token).

See **`docs/adr/001-passport-session-auth.md`** for the full auth architecture decision record.

**Production reference:** `.env.production.example` — set values in Railway/host dashboard, not in git.

## AniList developer portal

Register redirect URIs at https://anilist.co/settings/developer

| Environment | Redirect URI |
|-------------|--------------|
| Local | `http://localhost:5001/api/auth/callback` |
| Production | `https://anilistcal.com/api/auth/callback` |

**Login:** `GET /api/auth/login` — server OAuth; session cookie set on callback.

Client ID and secret in `.env` must match **that** AniList app. Dev and prod may use different app IDs.

### Common OAuth errors

- **`invalid_client`** — wrong `ANILIST_CLIENT_SECRET` for the client ID, or dev/prod credentials mixed up. Regenerate secret in AniList and update `.env`.
- **`#authError=...` in URL hash** — read the message; often redirect URI mismatch or missing env vars.

## Production (Railway)

- **Do not set `PORT`** in Railway — the platform injects it.
- Set `FRONTEND_URL` and `BACKEND_CALLBACK_URL` to the public domain (e.g. `https://anilistcal.com`).
- Add a **Redis** service and set **`REDIS_URL`** (sessions persist across deploys).
- Build: `yarn build` · Start: `yarn start`
- Health check: `GET /api/health`
- Helper script (after `railway login` + `railway link`): `./scripts/railway-fix-deployment.sh`

## Tests

```bash
yarn test
```
