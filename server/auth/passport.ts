import passport from "passport";
import { AniListUser } from "../types";
import { storage } from "../storage";
import { logger } from "../logger";
import { log } from "../vite";
import { createAniListStrategy } from "./anilistStrategy";

let configured = false;

export function configurePassport(): void {
  if (configured) {
    return;
  }

  if (process.env.ANILIST_CLIENT_ID && process.env.ANILIST_CLIENT_SECRET) {
    passport.use(createAniListStrategy());
  } else {
    log("WARNING: ANILIST_CLIENT_ID/SECRET not set — OAuth login routes will not work.");
  }

  passport.serializeUser((user: AniListUser, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const token = await storage.getToken(id);
      if (!token) {
        logger.debug(`[Passport Deserialize] No AniList token found for user ${id}`);
        return done(null, false);
      }

      const userInfo = await storage.getUserInfo(id);
      if (!userInfo) {
        logger.debug(`[Passport Deserialize] No user info found for user ${id}`);
        return done(null, false);
      }

      const user: AniListUser = {
        id,
        username: userInfo.username,
        avatarUrl: userInfo.avatarUrl,
      };

      done(null, user);
    } catch (err) {
      log(`Passport deserialize error: ${err}`);
      done(err);
    }
  });

  configured = true;
}

export { passport };
