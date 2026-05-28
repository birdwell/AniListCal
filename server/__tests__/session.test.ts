import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildSessionOptions, getSessionMaxAgeMs, getSessionCookieName } from "../auth/sessionConfig";
import type { Store } from "express-session";

describe("session config", () => {
  const originalEnv = { ...process.env };
  const mockStore = {} as Store;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults session max age to ~364 days", () => {
    delete process.env.SESSION_MAX_AGE_MS;
    expect(getSessionMaxAgeMs()).toBe(364 * 24 * 60 * 60 * 1000);
  });

  it("respects SESSION_MAX_AGE_MS override", () => {
    process.env.SESSION_MAX_AGE_MS = "3600000";
    expect(getSessionMaxAgeMs()).toBe(3600000);
  });

  it("uses sid as the session cookie name", () => {
    expect(getSessionCookieName()).toBe("sid");
  });

  it("builds secure httpOnly lax cookies in production", () => {
    process.env.NODE_ENV = "production";
    process.env.SESSION_SECRET = "test-secret";
    const options = buildSessionOptions(mockStore);

    expect(options.name).toBe("sid");
    expect(options.store).toBe(mockStore);
    expect(options.cookie?.httpOnly).toBe(true);
    expect(options.cookie?.secure).toBe(true);
    expect(options.cookie?.sameSite).toBe("lax");
    expect(options.cookie?.maxAge).toBe(getSessionMaxAgeMs());
  });

  it("builds non-secure cookies in development", () => {
    process.env.NODE_ENV = "development";
    const options = buildSessionOptions(mockStore);

    expect(options.cookie?.secure).toBe(false);
    expect(options.cookie?.sameSite).toBe("lax");
  });
});
