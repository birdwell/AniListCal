import type { Request, Response } from 'express';

/**
 * Sends HTML page for OAuth callback to store auth code in sessionStorage
 * and redirect to client-side SPA handler.
 * @param req Express Request
 * @param res Express Response
 */
export function handleSpaAuthCallback(req: Request, res: Response) {
  console.log('SPA Auth Callback received with code:', req.query.code ? 'present' : 'missing');

  const code = req.query.code as string;
  if (!code) {
    console.error('No authorization code received in callback');
    return res.redirect('/login?error=No_authorization_code_received');
  }

  // Properly escape the code for JavaScript
  const escapedCode = code.replace(/"/g, '\\"');
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
  console.log('Using redirect URI:', redirectUri);

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Authenticating...</title>
        <script>
          console.log('Auth callback page loaded');
          window.onload = function() {
            try {
              const code = "${escapedCode}";
              const redirectUri = "${redirectUri}";
              console.log("Storing auth code and redirect URI in sessionStorage");
              sessionStorage.setItem('auth_code', code);
              sessionStorage.setItem('auth_redirect_uri', redirectUri);
              console.log("Storage successful, redirecting to callback process");
              window.location.href = '/auth/callback-process';
            } catch (error) {
              console.error("Error during auth callback:", error);
              window.location.href = '/login?error=Auth_callback_failed';
            }
          }
        </script>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin:0; background-color:#f9fafb; color:#333; text-align:center; }
          .loader { border:4px solid #f3f3f3; border-radius:50%; border-top:4px solid #3498db; width:40px; height:40px; margin:0 auto 20px; animation:spin 1s linear infinite; }
          @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        </style>
      </head>
      <body>
        <div><div class="loader"></div><p>Authenticating with AniList...</p></div>
      </body>
    </html>
  `);
}
