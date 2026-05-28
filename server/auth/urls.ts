const port = parseInt(process.env.PORT || "5001", 10);

export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || `http://localhost:${port}`;
}

export function getBackendCallbackUrl(): string {
  return (
    process.env.BACKEND_CALLBACK_URL ||
    `http://localhost:${port}/api/auth/callback`
  );
}

export function getLoginFailureRedirect(errorMessage?: string): string {
  const url = new URL("/login", getFrontendUrl());
  if (errorMessage) {
    url.searchParams.set("error", errorMessage);
  }
  return url.toString();
}

export function getLoginSuccessRedirect(): string {
  return new URL("/", getFrontendUrl()).toString();
}
