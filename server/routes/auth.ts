import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { ANILIST_GRAPHQL_URL, ANILIST_TOKEN_URL } from "../constants";
import { AniListUser } from "../types";
import { validateApiToken } from "./middleware";

export function registerAuthRoutes(app: Express) {
  // Register the API token middleware for protected routes
  app.use(
    ["/api/anilist", "/api/auth/user", "/api/auth/refresh-token"],
    validateApiToken
  );

  app.post("/api/auth/callback", async (req, res) => {
    try {
      const { code, redirectUri } = req.body;

      if (!code) {
        throw new Error("Authorization code is required");
      }

      if (
        !process.env.ANILIST_CLIENT_ID ||
        !process.env.ANILIST_CLIENT_SECRET
      ) {
        throw new Error(
          "AniList client credentials are not properly configured"
        );
      }

      const tokenPayload = {
        grant_type: "authorization_code",
        client_id: process.env.ANILIST_CLIENT_ID,
        client_secret: process.env.ANILIST_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code: code,
      };

      const tokenResponse = await fetch(ANILIST_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(tokenPayload),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(
          `Failed to get access token: ${
            errorData.message || tokenResponse.statusText
          }`
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      const userResponse = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          query: `
            query {
              Viewer {
                id
                name
                avatar {
                  medium
                }
              }
            }
          `,
        }),
      });

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const userData = await userResponse.json();
      const anilistUser = userData.data.Viewer;
      const userId = anilistUser.id.toString();

      // Store token in our storage
      storage.storeToken(userId, accessToken);

      // Store user info
      storage.storeUserInfo(
        userId,
        anilistUser.name,
        anilistUser.avatar?.medium
      );

      // Generate an API token
      const apiToken = storage.generateApiToken(userId);

      // Create user object for session
      const user: AniListUser = {
        id: userId,
        username: anilistUser.name,
        avatarUrl: anilistUser.avatar?.medium,
      };

      // Log the user in by establishing a session
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Failed to establish session" });
        }

        // Return user info and API token
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            avatarUrl: user.avatarUrl,
          },
          apiToken: apiToken,
          expiresIn: 4 * 60 * 60, // 4 hours in seconds
        });
      });
    } catch (error: any) {
      console.error("Auth callback error:", error);
      res.status(500).json({ error: error.message || "Authentication failed" });
    }
  });

  // HTML page for OAuth callback
  app.get("/auth/callback", (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect("/login?error=No_authorization_code_received");
    }

    // Send the auth code to the client for processing via the SPA router
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
          <script>
            window.onload = function() {
              // Extract the code from the URL
              const code = "${code}";
              
              // Store it in sessionStorage for the client-side app
              sessionStorage.setItem('auth_code', code);
              
              // Redirect to the SPA auth callback handler without the code parameter
              setTimeout(() => {
                window.location.href = '/auth/callback-process';
              }, 100);
            }
          </script>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
              color: #333;
              text-align: center;
            }
            .loader {
              border: 4px solid #f3f3f3;
              border-radius: 50%;
              border-top: 4px solid #3498db;
              width: 40px;
              height: 40px;
              margin: 0 auto 20px;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div>
            <div class="loader"></div>
            <p>Authenticating with AniList...</p>
          </div>
        </body>
      </html>
    `);
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    // API token authentication is handled by middleware
    // By the time we get here, req.userId is already set
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get user info
    const userInfo = storage.getUserInfo(req.userId);
    if (!userInfo) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: req.userId,
      username: userInfo.username,
      avatarUrl: userInfo.avatarUrl,
    });
  });

  // Refresh API token endpoint
  app.post("/api/auth/refresh-token", (req, res) => {
    // API token validation is already done in middleware
    // If we get here, req.userId is set
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Generate a new API token
    const newApiToken = storage.generateApiToken(req.userId);

    res.json({
      apiToken: newApiToken,
      expiresIn: 4 * 60 * 60, // 4 hours in seconds
    });
  });

  // Endpoint to make authenticated AniList requests through our server
  app.post("/api/anilist/proxy", async (req, res) => {
    // API token validation is already done in middleware
    if (!req.userId || !req.anilistToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { query, variables } = req.body;

      if (!query) {
        return res.status(400).json({ error: "GraphQL query required" });
      }

      // Forward the request to AniList with the actual token
      const response = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${req.anilistToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("AniList proxy error:", error);
      res.status(500).json({ error: "Failed to proxy request to AniList" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      storage.revokeApiToken(token);
    }

    // If we have userId from token validation, revoke all tokens for that user
    if (req.userId) {
      storage.revokeToken(req.userId);
    }

    // Handle session logout if using session auth
    if (req.isAuthenticated()) {
      const user = req.user as AniListUser;
      if (user.id) {
        storage.revokeToken(user.id);
      }

      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ error: "Failed to logout" });
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).json({ error: "Failed to destroy session" });
          }
          res.clearCookie("sid"); // Use the custom cookie name
          res.json({ success: true });
        });
      });
    } else {
      res.json({ success: true });
    }
  });
}
