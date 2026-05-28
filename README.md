# AniListCal

A web application that integrates with AniList to create calendar events for your anime watching schedule.

## Prerequisites

- Node.js 18+
- Yarn (recommended) or npm

## Getting started

1. Clone the repository:

```bash
git clone https://github.com/birdwell/AniListCal.git
cd AniListCal
```

2. Install dependencies:

```bash
yarn install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your AniList OAuth credentials from https://anilist.co/settings/developer

Register this redirect URI for local dev:

```
http://localhost:5001/api/auth/callback
```

Required variables:

```env
ANILIST_CLIENT_ID=your_anilist_client_id
ANILIST_CLIENT_SECRET=your_anilist_client_secret
SESSION_SECRET=any_long_random_string
```

4. Run the app:

```bash
yarn dev
```

Open http://localhost:5001 in Chrome, Safari, or Firefox (OAuth redirects do not work in embedded IDE previews).

## Authentication

Login uses server-side OAuth with an HttpOnly session cookie. The browser never stores AniList or API tokens.

- Login: `GET /api/auth/login`
- Logout: `POST /api/auth/logout`

See [docs/adr/001-passport-session-auth.md](docs/adr/001-passport-session-auth.md) for architecture details.

## Production (Railway)

Set these on the app service:

```env
NODE_ENV=production
ANILIST_CLIENT_ID=...
ANILIST_CLIENT_SECRET=...
SESSION_SECRET=...
REDIS_URL=redis://...
FRONTEND_URL=https://anilistcal.com
BACKEND_CALLBACK_URL=https://anilistcal.com/api/auth/callback
```

Do not set `PORT` on Railway — the platform injects it.

Build and start: `yarn build` · `yarn start` · Health check: `GET /api/health`

More detail: [AGENTS.md](AGENTS.md)

## Tests

```bash
yarn test
```
