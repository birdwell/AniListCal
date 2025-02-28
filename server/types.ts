export interface AniListUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface AniListToken {
  userId: string;
  accessToken: string;
  expiresAt: number;
}

export interface ApiToken {
  token: string;
  userId: string;
  expiresAt: number;
}

export interface RefreshTokenResponse {
  apiToken: string;
  expiresIn: number;
}

export interface AniListGraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: {
      code?: string;
      [key: string]: any;
    };
  }>;
}
