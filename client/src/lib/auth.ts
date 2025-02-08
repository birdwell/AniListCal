import { createAuth0Client, Auth0Client } from "@auth0/auth0-spa-js";

let auth0Client: Auth0Client;

export async function initAuth0() {
  if (!auth0Client) {
    auth0Client = await createAuth0Client({
      domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
      authorizationParams: {
        redirect_uri: window.location.origin,
      },
    });
  }
  return auth0Client;
}

export async function login() {
  const client = await initAuth0();
  await client.loginWithRedirect();
}

export async function logout() {
  const client = await initAuth0();
  await client.logout({
    logoutParams: {
      returnTo: window.location.origin,
    },
  });
}

export async function getUser() {
  try {
    const client = await initAuth0();
    const isAuthenticated = await client.isAuthenticated();

    if (!isAuthenticated) {
      return null;
    }

    return await client.getUser();
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function handleRedirectCallback() {
  try {
    const client = await initAuth0();
    await client.handleRedirectCallback();
  } catch (error) {
    console.error("Error handling redirect:", error);
  }
}