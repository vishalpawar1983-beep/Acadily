import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { config } from '../../../config/index.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface RequestPasswordResetRequest {
  tenantId?: string;
  email: string;
}

export interface RequestPasswordResetResponse {
  message: string;
  resetToken: string;
}

export class RequestPasswordReset
  implements UseCase<RequestPasswordResetRequest, RequestPasswordResetResponse>
{
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(request: RequestPasswordResetRequest): Promise<RequestPasswordResetResponse> {
    const user = request.tenantId
      ? await this.userRepo.findByEmail(request.tenantId, request.email)
      : await this.userRepo.findByEmailAnyTenant(request.email);
    if (!user) {
      throw new NotFoundError('User', request.email);
    }

    const resolvedTenantId = user.tenantId;
    const resetToken = jwt.sign(
      { userId: user.id, tenantId: resolvedTenantId, purpose: 'password-reset' },
      config.JWT_ACCESS_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' } as SignOptions,
    );

    try {
      const emailService = new EmailService();
      const resetLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await emailService.send({
        to: request.email,
        tenantId: resolvedTenantId,
        subject: 'Password Reset',
        html: `<p>You requested a password reset.</p>
<p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>
<p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>`,
      });
    } catch (err) {
      logger.error({ err, email: request.email }, 'Failed to send password reset email');
    }

    return {
      message: 'Password reset token generated successfully',
      resetToken,
    };
  }
}
