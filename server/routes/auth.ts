import type { Express } from "express";
import { storage, AniListUser } from "../storage";
import { ANILIST_GRAPHQL_URL, ANILIST_TOKEN_URL } from "../constants";

export function registerAuthRoutes(app: Express) {
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

        console.error("Token exchange failed:", errorData);

        throw new Error(
          `Failed to get access token: ${
            errorData.message || tokenResponse.statusText
          }`
        );
      }

      const tokenData = await tokenResponse.json();

      const userResponse = await fetch(ANILIST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
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

      // Store token in our simple storage
      storage.storeToken(anilistUser.id.toString(), tokenData.access_token);

      // Create user object for session
      const user: AniListUser = {
        id: anilistUser.id.toString(),
        username: anilistUser.name,
        accessToken: tokenData.access_token,
        anilistId: anilistUser.id.toString() // Set anilistId to match the AniList user ID
      };

      // Log the user in by establishing a session
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ error: "Failed to establish session" });
        }
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            anilistId: user.anilistId // Include anilistId in the response
          },
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

    console.log(
      "Received auth callback with code:",
      code.substring(0, 5) + "..."
    );

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
              console.log("Got authentication code, storing temporarily...");
              
              // Store it in sessionStorage for the client-side app
              sessionStorage.setItem('auth_code', code);
              
              // Redirect to the SPA auth callback handler without the code parameter
              // Use a small timeout to ensure sessionStorage is set
              setTimeout(() => {
                console.log("Redirecting to SPA auth callback handler...");
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    // Only return safe user info (not the token)
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      anilistId: user.anilistId
    });
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    if (req.user) {
      const user = req.user;
      storage.removeToken(user.id);
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
  });
}
