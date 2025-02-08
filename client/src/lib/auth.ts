import { Auth0Client } from "@auth0/auth0-spa-js"; // Keeping this import for now, might be removable later

const ANILIST_AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize';

export async function login() {
  const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
  const redirectUri = `${window.location.origin}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  window.location.href = `${ANILIST_AUTH_URL}?${params.toString()}`;
}

export async function handleAuthCallback(code: string): Promise<void> {
  try {
    const response = await fetch('/api/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    // Redirect to home page after successful authentication
    window.location.href = '/';
  } catch (error) {
    console.error('Auth callback error:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

export async function getUser() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to get user');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}