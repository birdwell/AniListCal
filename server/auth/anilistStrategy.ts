import { Strategy as OAuth2Strategy, type VerifyCallback } from "passport-oauth2";
import {
  exchangeCodeForAccessToken,
  fetchAniListViewer,
  persistAniListLogin,
} from "./anilistOAuth";
import { getBackendCallbackUrl } from "./urls";
import { ANILIST_TOKEN_URL } from "../constants";

const ANILIST_AUTHORIZE_URL = "https://anilist.co/api/v2/oauth/authorize";

type AniListProfile = Awaited<ReturnType<typeof fetchAniListViewer>>;

function patchAniListTokenExchange(strategy: OAuth2Strategy): void {
  const oauth2 = (strategy as unknown as { _oauth2: { getOAuthAccessToken: Function } })._oauth2;

  oauth2.getOAuthAccessToken = (
    code: string,
    _params: Record<string, string>,
    callback: (err?: Error | null, accessToken?: string, refreshToken?: string, params?: object) => void
  ) => {
    exchangeCodeForAccessToken(code)
      .then(({ accessToken, expiresIn }) => {
        callback(null, accessToken, undefined, { expires_in: expiresIn });
      })
      .catch((err) => {
        callback(err instanceof Error ? err : new Error(String(err)));
      });
  };
}

export function createAniListStrategy(): OAuth2Strategy {
  const clientID = process.env.ANILIST_CLIENT_ID;
  const clientSecret = process.env.ANILIST_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    throw new Error("ANILIST_CLIENT_ID and ANILIST_CLIENT_SECRET must be set.");
  }

  const verify = async (
    accessToken: string,
    _refreshToken: string,
    params: { expires_in?: number },
    profile: AniListProfile,
    done: VerifyCallback
  ) => {
    try {
      const user = await persistAniListLogin(accessToken, params?.expires_in, profile);
      done(null, user);
    } catch (error) {
      done(error instanceof Error ? error : new Error(String(error)));
    }
  };

  const strategy = new OAuth2Strategy(
    {
      authorizationURL: ANILIST_AUTHORIZE_URL,
      tokenURL: ANILIST_TOKEN_URL,
      clientID,
      clientSecret,
      callbackURL: getBackendCallbackUrl(),
    },
    verify
  );

  // passport-oauth2 defaults to name "oauth2"; routes use authenticate("anilist").
  strategy.name = "anilist";

  patchAniListTokenExchange(strategy);

  strategy.userProfile = (
    accessToken: string,
    done: (err?: Error | null, profile?: AniListProfile) => void
  ) => {
    fetchAniListViewer(accessToken)
      .then((viewer) => done(null, viewer))
      .catch((err) => done(err instanceof Error ? err : new Error(String(err))));
  };

  return strategy;
}
