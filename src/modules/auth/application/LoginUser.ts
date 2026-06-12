import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import type { ITokenService, TokenPair } from './ports/ITokenService.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import { hashToken } from '../../../shared/infrastructure/crypto/tokenHash.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface LoginUserRequest {
  tenantId?: string;
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleType;
  };
  tokens: TokenPair;
}

export class LoginUser implements UseCase<LoginUserRequest, LoginUserResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const user = request.tenantId
      ? await this.userRepo.findByEmail(request.tenantId, request.email)
      : await this.userRepo.findByEmailAnyTenant(request.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await this.passwordHasher.compare(
      request.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

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
