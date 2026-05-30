# Vite 8 upgrade notes (PR #37)

This project upgraded **Vite 6 → 8** directly (skipping the v7 line) as part of a full dependency refresh. That matches the product goal; the official guide’s v7 stepping-stone is optional when the config stays minimal.

## Verified in CI

- `yarn run check`
- `yarn test` (68 tests, jsdom 29)
- `yarn build` (Rolldown bundler, `@rollup/plugin-graphql` via Rolldown compatibility)

## Manual check before merge

- `yarn dev` — OAuth login, HMR, `/api` proxy, calendar/home flows (not automated in CI)

## Toolchain details

| Change | Impact here |
|--------|-------------|
| Rolldown + Oxc (Vite 8) | No custom `rollupOptions` / `esbuild` options; graphql Rollup plugin unchanged |
| `@vitejs/plugin-react` v6 | `react()` with no options; no Babel plugins in use |
| `resolutions.vite` | Pins `^8.0.14` so the lockfile stays on Vite 8 |

If we later need Babel (e.g. `react({ babel: { plugins } })`), use `@rolldown/plugin-babel` — v6 ignores the old `babel` option shape.
