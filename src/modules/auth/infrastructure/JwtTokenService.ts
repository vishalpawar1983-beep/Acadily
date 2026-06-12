import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../../../config/index.js';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_ALGORITHMS: jwt.Algorithm[] = ['HS256'];

export class JwtTokenService {
  generateTokenPair(payload: TokenPayload): TokenPair {
    const accessToken = jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN,
      algorithm: 'HS256',
    } as SignOptions);

    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      algorithm: 'HS256',
    } as SignOptions);

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_ACCESS_SECRET, {
      algorithms: JWT_ALGORITHMS,
    }) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_REFRESH_SECRET, {
      algorithms: JWT_ALGORITHMS,
    }) as TokenPayload;
  }
}
