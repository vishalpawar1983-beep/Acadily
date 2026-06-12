import jwt from 'jsonwebtoken';
import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../../shared/domain/errors.js';
import { config } from '../../../config/index.js';

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

interface ResetTokenPayload {
  userId: string;
  tenantId: string;
  purpose: string;
}

export class ResetPassword implements UseCase<ResetPasswordRequest, ResetPasswordResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    let payload: ResetTokenPayload;
    try {
      payload = jwt.verify(request.token, config.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
      }) as ResetTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    if (payload.purpose !== 'password-reset') {
      throw new ValidationError('Invalid token purpose');
    }

    const user = await this.userRepo.findById(payload.tenantId, payload.userId);
    if (!user) {
      throw new NotFoundError('User', payload.userId);
    }

    const passwordHash = await this.passwordHasher.hash(request.newPassword);
    user.updatePassword(passwordHash);
    await this.userRepo.update(user);

    return { message: 'Password reset successfully' };
  }
}
