---
name: AniListCal
description: A calm, airing-first anime tracker connected to AniList.
colors:
  midnight: "hsl(257 38% 11%)"
  snow: "hsl(264 38% 97%)"
  surface-card: "hsl(0 0% 100%)"
  broadcast-violet: "hsl(266 51% 43%)"
  signal-red: "hsl(350 68% 53%)"
  sakura: "hsl(337 74% 80%)"
  airing-teal: "hsl(173 57% 31%)"
  muted-lilac: "hsl(267 27% 94%)"
  muted-foreground: "hsl(267 8% 42%)"
  border: "hsl(266 22% 87%)"
  warning: "hsl(36 100% 30%)"
  dark-background: "hsl(257 35% 8%)"
  dark-card: "hsl(263 29% 12%)"
  dark-primary: "hsl(275 80% 71%)"
typography:
  display:
    fontFamily: "ui-rounded, SF Pro Rounded, Arial Rounded MT Bold, Trebuchet MS, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: "2.125rem"
    letterSpacing: "-0.025em"
  title:
    fontFamily: "ui-rounded, SF Pro Rounded, Arial Rounded MT Bold, Trebuchet MS, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.015em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: "1.25rem"
    letterSpacing: "normal"
  data:
    fontFamily: "SFMono-Regular, Cascadia Mono, Roboto Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.03em"
rounded:
  badge: "6px"
  sm: "8px"
  control: "10px"
  card: "12px"
  feature: "16px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
  8: "32px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.broadcast-violet}"
    textColor: "{colors.surface-card}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.midnight}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.midnight}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.card}"
    padding: "20px"
  badge-primary:
    backgroundColor: "{colors.broadcast-violet}"
    textColor: "{colors.surface-card}"
    typography: "{typography.data}"
    rounded: "{rounded.badge}"
    padding: "2px 8px"
  feature-surface:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.midnight}"
    rounded: "{rounded.feature}"
    padding: "20px"
---

# Design System: AniListCal

## Overview

**Creative North Star: "Simple Anime Track with Focus on Airing Shows"**

AniListCal is a calm, precise, useful, and lightly warm operating surface for a viewer's daily anime routine. The interface should feel like a personal airing desk: it puts the next useful decision, real broadcast timing, and episode progress ahead of broad library administration. Anime artwork provides most of the visual color while product chrome stays quiet and legible.

The system is quiet at rest and responsive in action. Structure comes from spacing, typography, low-contrast tonal surfaces, and exact state color rather than ornamental effects. It must not resemble a general-purpose admin dashboard or attempt to imitate every AniList surface.

**Key Characteristics:**

- Airing information and progress are the visual signature.
- Quiet, precise product chrome lets anime artwork remain expressive.
- Light and dark themes retain the same semantic hierarchy.
- Controls feel immediate without becoming decorative or animated by default.
- Mobile targets and navigation are first-class, not compressed desktop leftovers.

## Colors

The palette pairs nocturnal violet neutrals with a disciplined broadcast signal system derived from the Fuji-and-calendar app icon.

### Primary

- **Broadcast Violet** (`hsl(266 51% 43%)`): primary actions, active navigation, links, focus, and brand emphasis in the light theme. The dark-theme counterpart is **Night Broadcast Violet** (`hsl(275 80% 71%)`).

### Secondary

- **Signal Red** (`hsl(350 68% 53%)`): a live or imminent airing state, reserved for a show airing within 24 hours.
- **Sakura** (`hsl(337 74% 80%)`): selection and rare supporting emphasis; it is not general decoration.

### Tertiary

- **Airing Teal** (`hsl(173 57% 31%)`): completed, healthy, or successfully aired states.
- **Warning Amber** (`hsl(36 100% 30%)`): time-sensitive caution without destructive meaning.

### Neutral

- **Midnight** (`hsl(257 38% 11%)`): light-theme foreground and the core dark neutral.
- **Snow** (`hsl(264 38% 97%)`): light canvas and dark-theme foreground.
- **White Card** (`hsl(0 0% 100%)`): light-theme cards and popovers.
- **Muted Lilac** (`hsl(267 27% 94%)`): quiet grouping, secondary controls, and hover surfaces.
- **Muted Ink** (`hsl(267 8% 42%)`): secondary text in the light theme.
- **Lilac Border** (`hsl(266 22% 87%)`): low-contrast dividers and card rings.
- **Night Canvas** (`hsl(257 35% 8%)`) and **Night Card** (`hsl(263 29% 12%)`): dark-theme canvas and raised surface roles.

### Named Rules

**The Signal Rule.** Signal Red communicates an episode airing within 24 hours; do not spend it on generic emphasis.

**The Artwork Rule.** Let cover art carry broad chromatic variety. Product chrome stays within the semantic palette.

## Typography

**Display Font:** `ui-rounded`, with SF Pro Rounded, Arial Rounded MT Bold, Trebuchet MS, and sans-serif fallbacks

**Body Font:** the native `ui-sans-serif` system stack

**Label/Mono Font:** SFMono-Regular, Cascadia Mono, Roboto Mono, then `ui-monospace`

**Character:** Rounded display type makes page and section landmarks approachable without turning the interface playful. The system body face keeps controls familiar, while restrained monospaced data makes episode counts, dates, countdowns, and compact states scan like broadcast information.

### Hierarchy

- **Display** (600, 30/34px, `-0.025em`): page titles; a 40/44px variant is reserved for a desktop next-up title.
- **Headline** (600, 20/28px, `-0.015em`): section headings and feature labels.
- **Title** (600, 16-20px, tight to 24-26px): anime titles and card headings.
- **Body** (400, 16/24px; 14/20px where density requires): descriptions, supporting content, and controls.
- **Label** (600, 14/20px): buttons, navigation, and short control labels.
- **Data** (500-600, 12-16px, tabular numerals where applicable): episode progress, dates, countdowns, badge text, and compact state labels.

### Named Rules

**The Data Earns Mono Rule.** Use the data face only for values and compact state labels; prose and navigation stay in the body face.

**The One Page Heading Rule.** `PageHeader` owns the single page-level `h1`; shared section headings use the display face at 20/28px.

## Layout

AniListCal uses one centered column system with responsive gutters rather than a dashboard grid. `PageShell` supplies 16px gutters on mobile, 24px on tablet, and 40px on desktop. Wide product surfaces stop at 1280px; narrow authentication, profile, and error surfaces stop at 768px.

The spacing rhythm is 4, 8, 12, 16, 24, 32, 48, and 64px. Pages generally use 24px vertical separation, tightening to 20px for dense mobile lists. Desktop navigation is a fixed 64px top bar beginning at the 768px breakpoint; mobile uses a fixed-flow 64px bottom navigation with safe-area padding. Dense grids collapse into stacked or horizontally scrollable structures before shrinking tap targets.

Mobile is an operating context, not a derivative layout: use full-width content, 44px controls, horizontal day selection, and safe-area-aware top and bottom spacing. Avoid persistent sidebars and multi-column administration patterns.

## Elevation & Depth

The system is flat by default. Cards use a subtle one-pixel ring or a tonal background, not blanket shadows. Ambient lift is reserved for popovers, feature surfaces, and meaningful interactive emphasis; hover may add a small shadow when it clarifies that an entire card is actionable.

### Shadow Vocabulary

- **Raised Light** (`0 12px 32px -20px hsl(257 38% 11% / 0.34)`): menus, popovers, and deliberately raised light-theme surfaces.
- **Raised Dark** (`0 16px 40px -22px hsl(0 0% 0% / 0.72)`): the dark-theme equivalent.
- **Quiet Card Ring** (`0 0 0 1px hsl(266 22% 87% / 0.70)`): the normal card boundary; use this before reaching for elevation.

### Named Rules

**The Flat-by-Default Rule.** A surface begins flat; elevation must explain hierarchy, layering, or interactivity.

## Shapes

Rounded geometry is consistent and restrained: 6px for badges, 8px for small nested elements and cover crops, 10px for buttons and text inputs, 12px for cards and primary interactive rows, and 16px for the single feature surface. Fully circular shapes are reserved for status dots, icon masks, and controls whose geometry requires them.

Borders are low-contrast structural lines. Do not combine a strong border, heavy shadow, and filled surface on the same container. Crop anime artwork cleanly with 8-12px corners and preserve its natural 2:3 cover proportion where the layout permits.

## Components

Components are quiet at rest and responsive in action. State changes use targeted 150ms color, border, opacity, transform, width, or shadow transitions; global reduced-motion rules suppress nonessential motion.

### Buttons

- **Shape:** 10px corners; default and icon buttons are 44px high, large buttons are 48px, and 40px controls are limited to dense desktop utilities.
- **Primary:** Broadcast Violet with white text, 16px horizontal padding, and semibold 14px labels.
- **Hover / Focus:** darken the fill slightly on hover; use a visible three-pixel semantic focus ring with a two-pixel canvas offset.
- **Outline:** white or card surface with an input-colored border; hover moves toward Muted Lilac and Broadcast Violet.
- **Secondary / Ghost / Link:** tonal secondary for contained alternatives, transparent ghost for navigation utilities, and underlined-on-hover violet for text links.

### Chips

- **Style:** 6px badge corners for static state; filter chips use 10px button geometry and the data face at 12px.
- **State:** selected filters use Broadcast Violet; unselected filters use the outlined button treatment. Interactive chips retain a 44px mobile target and may compact to 36px on wider screens.

### Cards / Containers

- **Corner Style:** 12px for cards; 16px for the singular feature surface.
- **Background:** White Card in light mode, Night Card in dark mode, or a low-opacity Muted Lilac treatment for interactive rows.
- **Shadow Strategy:** flat at rest with a subtle ring; ambient lift appears only on hover or intentional layering.
- **Border:** use a 70% Lilac Border ring instead of a heavy box border.
- **Internal Padding:** 20px by default, expanding to 24px on wider screens; compact anime rows use 12-16px.

### Inputs / Fields

- **Style:** 44px high, 10px corners, one-pixel input border, card background, and 14px horizontal padding.
- **Focus:** border shifts toward Broadcast Violet and gains a three-pixel ring with a two-pixel canvas offset.
- **Error / Disabled:** errors use the destructive semantic role; disabled controls preserve layout and reduce opacity to 50%.

### Navigation

Desktop navigation is a quiet 64px top bar with the brand mark, icon-label links, and a two-pixel Broadcast Violet active underline. Mobile navigation becomes a four-column 64px bottom bar with icon-over-label items. Active state uses Broadcast Violet; inactive items use Muted Ink and move toward the foreground on hover.

### Broadcast Band

The signature pattern combines episode progress and real airing data in a TV-guide-like strip: `EP 07 / 12  ━━━━━○━━  THU 20:30 · IN 2D`. Progress and time use the data face, Signal Red appears only inside the 24-hour window, and the mobile form wraps into two compact rows without shrinking controls below 44px.

## Do's and Don'ts

### Do:

- **Do** place the next actionable airing or progress decision ahead of broad library management.
- **Do** use real schedule and progress data as the interface's distinctive visual material.
- **Do** keep page gutters, headings, card geometry, focus rings, and mobile targets on their shared contracts.
- **Do** let anime artwork carry most of the screen's color while semantic chrome stays disciplined.
- **Do** use progressive disclosure when filters or supporting detail would compete with the primary task.

### Don't:

- **Don't** add gradient heroes, glass panels, ornamental cherry blossoms, or generic metric tiles.
- **Don't** turn the app into a general-purpose admin dashboard or a visual copy of AniList.
- **Don't** add subtitles, captions, or helper text that merely restate a heading or visible content.
- **Don't** frame every container with both a border and a shadow, or nest framed cards inside one another.
- **Don't** use raw palette colors for application state, `transition-all`, or motion that ignores reduced-motion preferences.
- **Don't** introduce a sidebar when the top-and-bottom navigation model already serves the product hierarchy.
