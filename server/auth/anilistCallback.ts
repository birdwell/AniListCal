import type { Request, Response, NextFunction } from "express";
import { passport } from "./passport";
import { getLoginFailureRedirect, getLoginSuccessRedirect } from "./urls";

/** Redirects to the frontend on OAuth failure; establishes session and redirects home on success. */
export function handleAniListCallback(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate("anilist", (err: Error | null, user: Express.User | false) => {
    if (err) {
      return res.redirect(getLoginFailureRedirect(err.message));
    }
    if (!user) {
      return res.redirect(getLoginFailureRedirect("Authentication failed"));
    }
    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return res.redirect(getLoginFailureRedirect(loginErr.message));
      }
      return res.redirect(getLoginSuccessRedirect());
    });
  })(req, res, next);
}
