import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import type { ITokenService, TokenPair } from './ports/ITokenService.js';
import { User } from '../domain/entities/User.js';
import { ConflictError } from '../../../shared/domain/errors.js';
import { hashToken } from '../../../shared/infrastructure/crypto/tokenHash.js';
import type { RoleType } from '../domain/value-objects/Role.js';

export interface RegisterUserRequest {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: RoleType;
}

export interface RegisterUserResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: RoleType;
  };
  tokens: TokenPair;
}

export class RegisterUser implements UseCase<RegisterUserRequest, RegisterUserResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    const existing = await this.userRepo.findByEmail(request.tenantId, request.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const user = User.create({
      tenantId: request.tenantId,
      email: request.email,
      passwordHash,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      role: request.role,
    });

    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    user.setRefreshToken(hashToken(tokens.refreshToken));
    await this.userRepo.save(user);

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
