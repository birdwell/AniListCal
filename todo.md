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
- [ ] **Backend: Replace In-Memory Storage:** Refactor `server/storage.ts` to use a persistent storage mechanism (e.g., Database, Redis) instead of in-memory `Map` objects to prevent token loss on server restarts. **(Current blocker)**
- [ ] **Review Token Expiry:** Consider the expiry of the *internal* `apiToken`. Since AniList tokens last a year and don't have refresh tokens, decide on a strategy if the internal token expires (e.g., prompt for re-login).
