import type { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { ANILIST_GRAPHQL_URL, ANILIST_TOKEN_URL } from '../../constants';
import type { AniListUser } from '../../types';

// Define the frontend URL (replace with environment variable in production)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5001';
// Define the backend callback URL (should match AniList settings)
const BACKEND_CALLBACK_URL = process.env.BACKEND_CALLBACK_URL || 'http://localhost:3001/api/auth/callback';

// Define the expected signature for the injected fetch function
type FetchFunction = (input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<globalThis.Response>;

/**
 * Handles the GET request from AniList OAuth callback.
 * Exchanges authorization code for access token, fetches AniList user info,
 * generates an internal API token, and redirects back to the frontend.
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @param fetchFn The fetch function to use (allows mocking)
 */
export const handleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction,
  fetchFn: FetchFunction // Inject fetch dependency
) => {
  console.log('[Server Auth Callback] Received request');
  try {
    const clientId = process.env.ANILIST_CLIENT_ID;
    const clientSecret = process.env.ANILIST_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[Server Auth Callback] AniList client credentials not configured on server.');
      throw new Error('Server configuration error.');
    }

    // Get code from query parameters (GET request)
    const code = req.query?.code as string | undefined;
    console.log(`[Server Auth Callback] Received code: ${code ? 'present' : 'missing'}`);

    if (!code) {
      throw new Error('Authorization code is required from AniList redirect.');
    }

    // Construct payload for token exchange
    const payload = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: BACKEND_CALLBACK_URL, // Must exactly match the URI registered with AniList and used in login redirect
      code,
    };

    console.log('[Server Auth Callback] Exchanging code for AniList token...', { clientId, redirectUri: BACKEND_CALLBACK_URL });

    // Exchange authorization code for access token using injected fetchFn
    const tokenRes = await fetchFn(ANILIST_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[Server Auth Callback] AniList token response status: ${tokenRes.status}`);

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('[Server Auth Callback] Failed to get access token:', err);
      throw new Error(`Failed to get access token: ${err.error_description || err.message || tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const expiresInAniList = tokenData.expires_in; // Original expiry from AniList (usually 1 year)

    if (!accessToken) {
      console.error('[Server Auth Callback] Access token missing in AniList response body.');
      throw new Error('Access token missing in AniList response.');
    }

    console.log(`[Server Auth Callback] Successfully obtained AniList access token (expires in ${expiresInAniList}s). Fetching user info...`);

    // Fetch AniList user info with access token using injected fetchFn
    const userRes = await fetchFn(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: `query { Viewer { id name avatar { medium } } }`,
      }),
    });

    console.log(`[Server Auth Callback] AniList user info response status: ${userRes.status}`);

    if (!userRes.ok) {
      const err = await userRes.json().catch(() => ({ message: 'Failed to parse error response' }));
      console.error('[Server Auth Callback] Failed to get user info:', err);
      throw new Error(`Failed to get user info: ${err.message || userRes.statusText}`);
    }

    const userData = await userRes.json();
    const viewer = userData.data?.Viewer;

    if (!viewer || !viewer.id) {
      console.error('[Server Auth Callback] Viewer data missing in AniList GraphQL response.');
      throw new Error('Failed to parse user info from AniList.');
    }

    const userId = viewer.id.toString();
    console.log(`[Server Auth Callback] Fetched user info for ID: ${userId}, Name: ${viewer.name}`);

    // Store token and user info using async storage
    console.log(`[Server Auth Callback] Storing AniList token and user info for user ${userId}...`);
    await storage.storeToken(userId, accessToken);
    await storage.storeUserInfo(userId, viewer.name, viewer.avatar?.medium);
    console.log(`[Server Auth Callback] AniList token and user info stored.`);

    // Generate internal API token for the client (now async)
    console.log(`[Server Auth Callback] Generating internal API token for user ${userId}...`);
    const internalApiToken = await storage.generateApiToken(userId);
    const internalTokenExpiresIn = 4 * 3600; // 4 hours in seconds

    console.log(`[Server Auth Callback] Generated internal API token for user ${userId}. Redirecting to frontend...`);

    // Redirect back to frontend with internal token and expiry in hash
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.hash = `apiToken=${internalApiToken}&expiresIn=${internalTokenExpiresIn}`;

    res.redirect(redirectUrl.toString());

  } catch (error: any) {
    // Error handling: Redirect to frontend with an error message
    console.error('[Server Auth Callback] Error during callback processing:', error);
    const frontendUrl = new URL(FRONTEND_URL);
    frontendUrl.hash = `authError=${encodeURIComponent(error.message || 'Unknown authentication error')}`;
    res.redirect(frontendUrl.toString());
    // Ensure no further processing
    // next(error); // Don't call next if redirecting
  }
};

