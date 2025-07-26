# Authentication Flow TODO

- [x] **Verify `queryAniList` Target:** Check `client/src/lib/auth.ts`. Ensure `queryAniList` (and any other authenticated client-side fetches) send requests to the internal backend API, not directly to AniList.
- [x] **Client: Add Auth Header:** Modify `queryAniList` (or the fetch wrapper it uses) in `client/src/lib/auth.ts`:
    - Retrieve the internal `apiToken` using `getApiToken()` from `sessionStorage`.
    - If a token exists and isn't expired, add the `Authorization: Bearer <apiToken>` header to requests targeting the internal backend API.
- [x] **Backend: Implement Token Validation Middleware:**
    - Create or verify middleware for the backend API routes that require authentication.
    - This middleware should extract the `Bearer` token from the `Authorization` header.
    - Validate the token (check signature, expiry, find associated user in DB/cache).
    - If valid, attach user information (e.g., user ID, AniList access token) to the request object for downstream handlers.
    - If invalid or missing, reject the request with a 401 Unauthorized status.
- [x] **Backend: Use AniList Token:** Ensure backend API handlers that need to fetch data from AniList:
    - Access the user's AniList `access_token` (retrieved by the auth middleware).
    - Include this AniList token in the `Authorization: Bearer <AniListAccessToken>` header when making requests to `graphql.anilist.co`.
- [x] **Client: Improve Error Handling:** Enhance error handling in `getUser` and `queryAniList` to provide more specific feedback (e.g., distinguish between "no token", "invalid token", "network error"). *(Added detailed logging)*
- [x] **Refactor App.tsx Auth Handling:** Use state (`isProcessingAuth`) to prevent router/auth checks until URL hash token is processed. *(Implemented)*
- [x] **Backend: Replace In-Memory Storage:** Refactor `server/storage.ts` to use a persistent storage mechanism (e.g., Database, Redis) instead of in-memory `Map` objects to prevent token loss on server restarts. *(Implemented using node-persist)*
- [ ] **Review Token Expiry:** Consider the expiry of the *internal* `apiToken`. Since AniList tokens last a year and don't have refresh tokens, decide on a strategy if the internal token expires (e.g., prompt for re-login).

# Testing Plan (Aiming for 100% Coverage)

## General Setup
- [x] **Choose Frameworks:** Confirm/setup testing frameworks (e.g., Vitest for both client & server, React Testing Library for client components). *(Confirmed)*
- [x] **Configure Coverage:** Set up test coverage reporting (e.g., `vitest --coverage`) and configure thresholds aiming for 100% line/branch/function coverage. *(Config files created)*

## Backend (`server/`)
- [x] **Storage (`storage.ts`):**
    - Write unit tests mocking `node-persist` methods (`init`, `setItem`, `getItem`, `removeItem`, etc.).
    - Test token generation, validation (valid/invalid/expired), retrieval, and revocation logic.
- [ ] **Handlers (`handlers/*.ts`):**
    - Write unit tests for each handler (`handleAuthCallback`, `handleGetUser`, `handleLogout`, `handleProxy`).
    - Mock the `storage` module completely.
    - Mock `fetch` calls to AniList API endpoints.
    - Mock request/response objects (`req`, `res`, `next`).
    - Verify correct status codes, response bodies, redirects, and calls to `storage` methods based on input.
- [ ] **Middleware (`middleware.ts`):**
    - Write unit/integration tests for `validateApiToken`.
    - Mock `storage` module.
    - Simulate requests with/without valid/invalid/expired `Authorization` headers.
    - Verify `req.userId`, `req.anilistToken` are set correctly.
    - Verify correct calls to `next()` or `res.status().json()`.
    - Test `deserializeUser` by mocking `storage` and verifying `done()` callback arguments.
- [ ] **Routes (`auth.ts`, `index.ts`):**
    - Write integration tests using `supertest` to make HTTP requests to the running server (or a test instance).
    - Mock `node-persist` and external `fetch` calls (AniList).
    - Test the full flow for `/auth/callback` -> get token -> `/api/auth/user` -> `/api/anilist/proxy`.
    - Test protected routes return 401 without a valid token.
    - Test logout route revokes tokens correctly.

## Frontend (`client/`)
- [ ] **Auth Utilities (`lib/auth.ts`):**
    - Write unit tests for `login`, `logout`, `getApiToken`, `isTokenExpired`, `isAuthenticated`, `clearAuthData`, `queryAniList`, `getUser`.
    - Mock `fetch` calls to backend API endpoints.
    - Mock `sessionStorage` (e.g., using `vitest.spyOn` or jest equivalent).
    - Mock `queryClient.invalidateQueries`.
    - Mock `window.location` where necessary (e.g., for `login` redirect).
    - Verify correct API calls, storage interactions, and return values/errors.
- [ ] **App Component (`App.tsx`):**
    - Write component tests using React Testing Library.
    - Mock `wouter` hooks (`useLocation`, `setLocation`).
    - Mock `auth.ts` functions (`clearAuthData`, `STORAGE_KEYS`).
    - Mock `queryClient`. 
    - Test initial render state.
    - Simulate scenarios with URL hash (valid token, error, no token) and verify: 
        - Loading state (`isProcessingAuth`).
        - `sessionStorage` calls.
        - `clearAuthData` calls.
        - `setLocation` calls.
        - Correct rendering after processing.
- [ ] **ProtectedRoute (`App.tsx`):**
    - Write component tests using React Testing Library.
    - Mock `wouter` hooks.
    - Mock `auth.ts` functions (`isAuthenticated`, `getUser`, `clearAuthData`).
    - Test rendering based on `isAuthenticated` result.
    - Test loading state (`isLoading` from mocked `useQuery`).
    - Test error handling from mocked `useQuery`.
    - Test redirection logic (`setLocation`).
- [ ] **Login Page (`pages/login.tsx`):**
    - Write basic component test.
    - Mock `auth.ts` (`login` function).
    - Simulate button click and verify `login()` is called.
- [ ] **(Optional) E2E Tests:**
    - Consider using Cypress or Playwright for end-to-end tests.
    - Focus on the core login flow: Click login -> (potentially intercept/mock AniList redirect) -> Verify redirect back -> Verify app state shows logged-in user.
    - Test logout flow.

## Iteration
- [ ] **Refactor for Testability:** As tests are written, refactor code where necessary to improve isolation and testability (e.g., dependency injection, pure functions).
- [ ] **Address Coverage Gaps:** Analyze coverage reports and write additional tests to cover any missed lines or branches.

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