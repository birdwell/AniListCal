import { describe, it, expect } from "vitest";
import { createAniListStrategy } from "../auth/anilistStrategy";

describe("createAniListStrategy", () => {
  it('registers as "anilist" so passport.authenticate("anilist") works', () => {
    process.env.ANILIST_CLIENT_ID = "mockClientId";
    process.env.ANILIST_CLIENT_SECRET = "mockClientSecret";
    process.env.BACKEND_CALLBACK_URL = "http://localhost:5001/api/auth/callback";

    const strategy = createAniListStrategy();
    expect(strategy.name).toBe("anilist");
  });
});
