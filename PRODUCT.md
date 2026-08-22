# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anime watchers who already use AniList and want a focused place to decide what to watch now or next, check what is airing, and keep their episode progress current. They may use AniListCal from a desktop browser or as an installed PWA.

## Product Purpose

AniListCal is a personal anime airing desk. It brings a viewer's AniList library, immediate watch-next decision, weekly airing schedule, and progress controls into one focused app. Success means a returning user can understand what is available and act on it within seconds.

## Positioning

AniListCal is a focused daily companion layered on top of AniList, not a general-purpose AniList replacement. Its distinctive job is to combine live airing context with the user's actual watch progress so the next viewing decision and the resulting update happen in the same place.

## Operating Context

- Users sign in through AniList and work with their existing anime list.
- The Today view surfaces a watch-next choice and organizes current, paused, and planned shows.
- The Calendar view presents an in-app seven-day airing schedule.
- Search, show details, status changes, and episode progress updates support the daily workflow without requiring a return to AniList for routine actions.
- Light, dark, and system themes are supported across responsive browser and installed-PWA use.

## Capabilities and Constraints

- AniList is the source of account, library, media, airing, and progress data.
- Authentication is server-side OAuth. AniList tokens remain on the server and the browser uses an HttpOnly session cookie.
- Existing capabilities include list management, episode increment and decrement controls, a watch-next card, weekly schedule, anime search, status updates, show details, profile, and PWA installation.
- Product work should create repeat in-app utility. External calendar export or synchronization is not part of the current product direction.
- New features must not repackage an existing control or workflow as a new capability.
- AniListCal remains an independent application and must not imply affiliation with AniList.

## Brand Commitments

- Preserve the AniListCal name and the existing Fuji-and-calendar app icon.
- The product voice is concise, direct, and useful. Avoid helper copy that merely restates a heading or visible content.
- Anime artwork and real schedule information are primary product material; the interface should not invent decorative content or claims.

## Evidence on Hand

- Real authenticated AniList library, media, airing, status, and progress data are available through the product's AniList integration.
- The existing product implementation and feature catalog are documented in `docs/ARCHITECTURE.md`.
- The existing interface system and brand assets are documented in `docs/DESIGN_SYSTEM.md`, `client/src/index.css`, `client/src/components/brand-mark.tsx`, and `client/public/`.
- No testimonials, customer logos, usage benchmarks, or press claims are currently established; future work must not fabricate them.

## Product Principles

1. Answer the immediate question first: what can the user watch now, and what airs next?
2. Keep daily viewing decisions and routine AniList updates inside AniListCal.
3. Add distinct utility only after checking the capability is not already present.
4. Prefer one clear, evidence-backed action over vague or duplicative choices.
5. Treat privacy, reliable progress updates, and real airing data as product fundamentals.

## Accessibility & Inclusion

- Preserve semantic heading order, native links and buttons, visible keyboard focus, and accessible names for icon-only controls.
- Primary mobile controls must provide at least 44 by 44 pixel targets.
- Respect reduced-motion preferences and maintain usable light and dark themes.
