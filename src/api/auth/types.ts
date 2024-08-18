interface User {
  id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
}

export interface AccessToken {
  token: string;
  expirationTime: number;
}

export interface RefreshToken {
  token: string;
  expirationTime: number;
}

export interface Session {
  user: User;
  accessToken: AccessToken;
  refreshToken: RefreshToken;
}
