export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  /** Embedded so verifyToken can respond without a DB round-trip */
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenService {
  generateTokenPair(payload: TokenPayload): TokenPair;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
}
