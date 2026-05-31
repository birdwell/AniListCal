# Production Deployment Checklist

## Pre-deployment

- [ ] Set a strong `SESSION_SECRET` in production
- [ ] Configure AniList OAuth credentials for production
- [ ] Register production redirect URI: `https://your-domain.com/api/auth/callback`
- [ ] Set `FRONTEND_URL` and `BACKEND_CALLBACK_URL` to your public domain
- [ ] Add Redis and set `REDIS_URL` on the app service (sessions and AniList tokens survive restarts/deploys)
- [ ] Set `NODE_ENV=production`
- [ ] Do **not** set `PORT` on Railway (platform injects it)

## Build

- [ ] Run `yarn build` locally or in CI
- [ ] Verify the build completes successfully

## Deploy

- [ ] Deploy to Railway (or your host)
- [ ] Confirm all environment variables are set on the **app service**
- [ ] HTTPS is enabled on your public domain

## Post-deployment verification

- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] `GET /api/auth/login` redirects to AniList OAuth
- [ ] Full login → callback → home flow works in a real browser
- [ ] Logout clears the session
- [ ] GraphQL proxy works for authenticated users (`POST /api/anilist/proxy`)
- [ ] Session and AniList API access survive a redeploy (requires `REDIS_URL`)

## Security

- [ ] AniList client secret and `SESSION_SECRET` are only in the host dashboard, not in git
- [ ] Session cookie is HttpOnly and secure in production
- [ ] Rate limiting is active on `/api/` routes

## Decommission Render (legacy)

Production runs on **Railway** only. If Render still posts failed PR deployment checks:

1. [Render Dashboard](https://dashboard.render.com/) → open the linked **AniListCal** web service
2. **Settings** → disconnect the GitHub repo (or delete the service entirely)
3. Optional: remove the Render GitHub App from [GitHub repo settings → Integrations](https://github.com/birdwell/AniListCal/settings/installations)

`render.yaml` and deploy scripts were removed in commit `799fe79`; any remaining deploys come from the Render dashboard integration, not this repo.

## Optional follow-ups

- [ ] Set up uptime monitoring on `/api/health`

## References

- [AGENTS.md](AGENTS.md) — local dev and Railway setup
- [docs/adr/001-passport-session-auth.md](docs/adr/001-passport-session-auth.md) — auth architecture
