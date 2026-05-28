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
VITE_ANILIST_CLIENT_ID=...   # same value as ANILIST_CLIENT_ID
SESSION_SECRET=...           # any long random string
```

**Not used:** `DATABASE_URL` — persistence is `node-persist` (`.persist-storage/`), not Postgres.

**Production reference:** `.env.production.example` — set values in Railway/host dashboard, not in git.

## AniList developer portal

Register redirect URIs at https://anilist.co/settings/developer

| Environment | Redirect URI |
|-------------|--------------|
| Local | `http://localhost:5001/api/auth/callback` |
| Production | `https://anilistcal.com/api/auth/callback` |

Client ID and secret in `.env` must match **that** AniList app. Dev and prod may use different app IDs.

### Common OAuth errors

- **`invalid_client`** — wrong `ANILIST_CLIENT_SECRET` for the client ID, or dev/prod credentials mixed up. Regenerate secret in AniList and update `.env`.
- **`#authError=...` in URL hash** — read the message; often redirect URI mismatch or missing env vars.

## Production (Railway)

- **Do not set `PORT`** in Railway — the platform injects it.
- Set `FRONTEND_URL` and `BACKEND_CALLBACK_URL` to the public domain (e.g. `https://anilistcal.com`).
- Build: `yarn build` · Start: `yarn start`
- Health check: `GET /api/health`
- Helper script (after `railway login` + `railway link`): `./scripts/railway-fix-deployment.sh`

## Tests

```bash
yarn test
```
