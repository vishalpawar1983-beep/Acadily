import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { ITokenService, TokenPair } from './ports/ITokenService.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { hashToken, compareTokenHash } from '../../../shared/infrastructure/crypto/tokenHash.js';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: TokenPair;
}

export class RefreshToken implements UseCase<RefreshTokenRequest, RefreshTokenResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(request.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(payload.tenantId, payload.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    // Timing-safe comparison of hashed refresh token
    if (
      !user.refreshToken ||
      !compareTokenHash(request.refreshToken, user.refreshToken)
    ) {
      // Token reuse detected — invalidate all tokens
      user.setRefreshToken(undefined);
      await this.userRepo.update(user);
      throw new UnauthorizedError('Token reuse detected');
    }

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    user.setRefreshToken(hashToken(tokens.refreshToken));
    await this.userRepo.update(user);

    return { tokens };
  }
}
