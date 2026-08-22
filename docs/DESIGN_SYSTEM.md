# AniListCal design system

AniListCal is a personal anime airing desk. Its primary job is to answer “What can I watch now, and what airs next?” and make a progress update immediate. It should not resemble a general-purpose admin dashboard or reproduce every surface in AniList.

## Visual direction

The palette comes from the existing Fuji-and-calendar app icon. Anime artwork supplies most of the visual color; the product chrome stays quiet and precise.

| Token | Hex | Use |
| --- | --- | --- |
| Midnight | `#171126` | Core dark neutral and light-theme text |
| Snow | `#F8F6FB` | Light canvas and dark-theme text |
| Broadcast violet | `#6736A5` | Primary actions and focus |
| Signal red | `#D93652` | A show airing within 24 hours |
| Sakura | `#F2A8C4` | Selection and rare supporting emphasis |
| Airing teal | `#227D73` | Completed and healthy states |

`live`, `success`, `warning`, and `destructive` are distinct semantic tokens. Do not use a raw Tailwind color to communicate application state.

## Typography

- Display: `ui-rounded`, SF Pro Rounded, Arial Rounded MT Bold, Trebuchet MS. Use sparingly for page, section, and next-up titles.
- Body: the native system sans stack for fast, legible interface text.
- Data: SFMono, Cascadia Mono, Roboto Mono, then `ui-monospace`. Use through `font-data` for episode counts, dates, countdowns, and compact state labels.

The supported scale is 12/16 utility, 14/20 small, 16/24 body, 20/26 section, 30/34 page, and 40/44 for a desktop next-up title. Most interface type uses weight 600 or below; reserve 700 for the next-up title.

## Spacing and layout

Use the 4, 8, 12, 16, 24, 32, 48, and 64 pixel rhythm. `PageShell` supplies shared gutters of 16 pixels on mobile, 24 on tablet, and 40 on desktop.

- `PageShell size="wide"`: 1280 pixel maximum for Home, Calendar, Search, and show details.
- `PageShell size="narrow"`: 768 pixel maximum for Profile, authentication, and errors.
- `PageHeader`: the only page-level heading pattern; descriptions are optional and must add information.
- `SectionHeading`: a consistent `h2`, optional count, and one action.

Controls use a 10 pixel radius, cards 12 pixels, and the single feature surface 16 pixels. There are two elevation levels: flat and `shadow-raised`. Do not add a border and shadow to every container, and do not nest framed cards.

## Components

### Buttons

Default and icon buttons are 44 pixels tall; large buttons are 48. The 40 pixel small size is only for dense desktop utilities, never episode progress. Buttons use a three-pixel visible focus ring and targeted 150ms transitions. Do not use `transition-all`.

### Cards

Cards are quiet grouping surfaces with a subtle ring and no default shadow. Interactive cards change their ring or background; they do not jump upward or gain a large shadow.

### Inputs

Inputs are 44 pixels tall and require a visible label or accessible name. A placeholder is an example, not a label.

### Badges

Badges communicate status or data. They use the data typeface and a compact six-pixel radius. They have no hover state unless they are genuinely interactive.

## Signature: the broadcast band

The broadcast band combines episode progress and real airing data in one TV-guide-like strip:

```text
EP 07 / 12  ━━━━━○━━  THU 20:30 · IN 2D
```

Signal red is used only when the next episode airs within 24 hours. On mobile the band wraps into two compact rows. The progress fill may respond for 160ms after a successful episode update; otherwise motion stays restrained.

## Accessibility and motion

- Keep primary mobile targets at least 44 by 44 pixels.
- Use native links and buttons rather than clickable `div` elements.
- Preserve `h1` page, `h2` section, and `h3` item hierarchy.
- Provide accessible names for icon-only controls.
- Every keyboard action needs a visible focus indicator.
- The global reduced-motion rule suppresses nonessential animation and smooth scrolling.

## Restraint

Avoid gradient heroes, glass panels, ornamental cherry blossoms, generic metric tiles, blanket shadows, and scattered animation. The brand signature comes from real schedule and progress information, not decoration.
