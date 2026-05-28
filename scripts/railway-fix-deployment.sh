#!/usr/bin/env bash
# Diagnose and fix common Railway 502 issues for AniListCal.
# Requires: railway login + railway link (in repo root)

set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Railway deployment doctor ==="

if ! command -v railway >/dev/null; then
  echo "Install CLI: npm i -g @railway/cli@latest"
  exit 1
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Not logged in. Run: railway login"
  echo "Or set RAILWAY_API_TOKEN for CI/non-interactive use."
  exit 1
fi

echo "Logged in as: $(railway whoami 2>/dev/null || true)"
railway status || { echo "Run: railway link"; exit 1; }

echo ""
echo "--- Current variables (names only) ---"
railway variable list 2>/dev/null || railway variables 2>/dev/null || true

if railway variable list 2>/dev/null | grep -q '^PORT='; then
  echo ""
  echo "Removing PORT (Railway must inject this — hardcoded PORT causes 502)..."
  railway variable delete PORT -y 2>/dev/null || railway variable delete PORT
fi

for key in NODE_ENV ANILIST_CLIENT_ID ANILIST_CLIENT_SECRET VITE_ANILIST_CLIENT_ID SESSION_SECRET; do
  if ! railway variable list 2>/dev/null | grep -q "^${key}="; then
    echo "WARNING: ${key} is not set in Railway"
  fi
done

DOMAIN="$(railway domain 2>/dev/null | tail -1 || true)"
if [[ -n "$DOMAIN" && "$DOMAIN" == *railway.app* ]]; then
  echo ""
  echo "Public URL: https://${DOMAIN}"
  echo "Set in Railway (if not already):"
  echo "  FRONTEND_URL=https://${DOMAIN}"
  echo "  BACKEND_CALLBACK_URL=https://${DOMAIN}/api/auth/callback"
  echo "AniList redirect URI: https://${DOMAIN}/api/auth/callback"
fi

echo ""
echo "--- Redeploying ---"
railway up --detach -y 2>/dev/null || railway redeploy -y

echo ""
echo "--- Recent deploy logs ---"
railway logs -n 40 2>/dev/null || true

echo ""
echo "Health check: curl https://YOUR-DOMAIN/api/health"
echo "Done."
