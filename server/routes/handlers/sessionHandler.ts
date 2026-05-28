import type { Request, Response, NextFunction } from "express";
import { storage } from "../../storage";

/**
 * Returns whether the request has an active session (no AniList token required).
 */
export async function handleGetSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!req.isAuthenticated?.() || !user?.id) {
      return res.json({ authenticated: false });
    }

    const userInfo = await storage.getUserInfo(user.id);
    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        username: userInfo?.username ?? user.username,
        avatarUrl: userInfo?.avatarUrl ?? user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}
