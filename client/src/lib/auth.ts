import { queryClient } from "./queryClient";

const ANILIST_AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize';

export async function login() {
  const clientId = import.meta.env.VITE_ANILIST_CLIENT_ID;
  if (!clientId) {
    throw new Error('Anilist client ID is not configured');
  }

  console.log('Starting Anilist OAuth flow');
  const redirectUri = `${window.location.origin}/api/auth/callback`;
  console.log('Using redirect URI:', redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
  });

  // Changed to directly set window.location.href instead of window.open
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Authentication failed');
    }

    // After successful authentication, redirect to home page
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