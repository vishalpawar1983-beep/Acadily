import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IUserRepository } from '../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './ports/IPasswordHasher.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';

export interface SendOtpRequest {
  tenantId: string;
  email: string;
  password: string;
}

export interface SendOtpResponse {
  message: string;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class SendOtp implements UseCase<SendOtpRequest, SendOtpResponse> {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly emailService: EmailService,
  ) {}

  async execute(request: SendOtpRequest): Promise<SendOtpResponse> {
    const user = await this.userRepo.findByEmail(request.tenantId, request.email);
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

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.setOtp(otp, otpExpiresAt);
    await this.userRepo.update(user);

    await this.emailService.send({
      to: user.email,
      subject: 'Your OTP Code - Flex Academy',
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It expires in 10 minutes.</p>`,
      tenantId: request.tenantId,
    });

    return { message: 'OTP sent successfully' };
  }
}
