# Authentication (completed — see docs/adr/001-passport-session-auth.md)

Passport + HttpOnly session cookies. Server OAuth via `/api/auth/login`. No client-side token storage.

- [x] Session cookies with Redis in production
- [x] Passport AniList OAuth strategy and routes
- [x] `requireAuth` middleware; internal API tokens removed
- [x] Client uses `credentials: 'include'` only
- [x] AniList token expiry → re-login flow (`ANILIST_TOKEN_EXPIRED`)
- [x] Tests, ADR, Railway production setup

# Testing Plan

## General Setup
- [x] Vitest + React Testing Library configured

## Backend (`server/`)
- [x] **Storage (`storage.ts`)** — AniList token persistence tests
- [x] **Auth** — session config, OAuth helpers, clearSession, anilistStrategy tests
- [x] **Handlers** — getUser, logout, proxy handler tests
- [ ] **Integration tests** — full OAuth flow with supertest + cookie jar (optional)

## Frontend (`client/`)
- [x] **Auth utilities (`lib/auth/index.ts`)** — cookie-based auth tests
- [ ] **ProtectedRoute / App.tsx** — component tests (optional)
- [ ] **(Optional) E2E** — Playwright/Cypress login flow

## Iteration
- [ ] Address coverage gaps as needed

# Feature: Tag Filtering (using Zustand)

- [x] **Install Zustand:** Add `zustand` as a project dependency using `yarn`.
- [x] **Create Zustand Store (`filterStore.ts`):**
    - Create a new file (`client/src/stores/filterStore.ts`).
    - Define a Zustand store containing:
        - `searchQuery: string`
        - `setSearchQuery: (query: string) => void`
        - `selectedTags: string[]`
        - `addTag: (tag: string) => void`
        - `removeTag: (tag: string) => void`
        - `clearTags: () => void`
- [x] **Refactor Search State:**
    - Modify `AnimeContent.tsx` to use `searchQuery` and `setSearchQuery` from the Zustand store instead of local `useState`.
    - Update `SearchBar.tsx` props to accept the store's `searchQuery` and `setSearchQuery` function signature `(query: string) => void`.
- [x] **Data Source / Tag Availability:** Verify that tags are available on the `EntyFragmentFragment`. (Confirmed: `entry.media.tags` and `entry.media.genres` exist).
- [x] **Collect & Categorize Tags:** In `AnimeContent.tsx`, gather a unique list of all tags (`entry.media.tags.name`) and genres (`entry.media.genres`) present across all `animeEntries`. Structure this data by category (using `tag.category` and assigning a "Genre" category), e.g., `categorizedTags: Record<string, string[]>`. Sort categories and tags alphabetically.
- [x] **UI Component Refactor (`TagFilter.tsx`):**
    - Update props to accept `categorizedTags: Record<string, string[]>`. 
    - Add state for an internal text filter (`internalFilterQuery: string`).
    - Add an `Input` field for the internal text filter.
    - Display selected tags prominently at the top (clickable for deselection).
    - Display tags grouped by category.
    - Filter displayed tags within each category based on `internalFilterQuery`.
    - Ensure tags in the main list are clickable for selection/deselection and visually indicate selection state.
    - Keep the "Clear All" button.
    - Use a `ScrollArea` for the main categorized tag list.
- [x] **Integration Refactor (`AnimeContent.tsx`):**
    - Remove the `Popover` integration.
    - Add state to manage the visibility of the tag filter section (e.g., `isTagFilterOpen: boolean`).
    - Use a `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` structure below the search bar area.
    - The `Button` with `SlidersHorizontal` becomes the `CollapsibleTrigger`.
    - Place the refactored `TagFilter` component inside `CollapsibleContent`.
    - Pass the `categorizedTags` prop to `TagFilter`.
    - Update the trigger button badge logic.
- [x] **Filtering Logic Update:** In `AnimeContent.tsx`, ensure the main filtering logic (`filteredAndTaggedEntries`) correctly uses the `selectedTags` from the store (using `.every()` for matching all selected tags).
- [ ] **Update Tests:** Write/update unit/integration tests for the store, `TagFilter`, and `AnimeContent` reflecting the new structure and functionality.
- [ ] **Styling:** Apply/adjust styling for the collapsible section, internal filter input, selected tags area, and categorized lists. (Minor adjustments done, keep open for further refinement). 