import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { ITokenService, TokenPair } from './ports/ITokenService.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { hashToken } from '../../../shared/infrastructure/crypto/tokenHash.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface VerifyOtpRequest {
  tenantId: string;
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleType;
  };
  tokens: TokenPair;
}

export class VerifyOtp implements UseCase<VerifyOtpRequest, VerifyOtpResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const user = await this.userRepo.findByEmail(request.tenantId, request.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or OTP');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (!user.isOtpValid(request.otp)) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    user.clearOtp();

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    user.setRefreshToken(hashToken(tokens.refreshToken));
    await this.userRepo.update(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens,
    };
  }
}
