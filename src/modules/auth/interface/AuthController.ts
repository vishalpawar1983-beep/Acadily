import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { RegisterUser } from '../application/RegisterUser.js';
import { LoginUser } from '../application/LoginUser.js';
import { RefreshToken } from '../application/RefreshToken.js';
import { GetMe } from '../application/GetMe.js';
import { LogoutUser } from '../application/LogoutUser.js';
import { SendOtp } from '../application/SendOtp.js';
import { VerifyOtp } from '../application/VerifyOtp.js';
import { ResendOtp } from '../application/ResendOtp.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { MongoUserRepository } from '../infrastructure/MongoUserRepository.js';
import { PasswordService } from '../infrastructure/PasswordService.js';
import { JwtTokenService } from '../infrastructure/JwtTokenService.js';
import { ValidationError } from '../../../shared/infrastructure/middleware/errorHandler.js';
import { authAttemptsTotal } from '../../../shared/infrastructure/metrics/MetricsService.js';

const userRepo = new MongoUserRepository();
const passwordService = new PasswordService();
const tokenService = new JwtTokenService();
const emailService = new EmailService();

export class AuthController {
  async register(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new RegisterUser(userRepo, passwordService, tokenService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        // Role is NOT accepted from public registration — always defaults to Student
      });
      authAttemptsTotal.inc({ type: 'register', result: 'success' });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      authAttemptsTotal.inc({ type: 'register', result: 'failure' });
      next(err);
    }
  }

  async login(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;

      const useCase = new LoginUser(userRepo, passwordService, tokenService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
        password: req.body.password,
      });
      authAttemptsTotal.inc({ type: 'login', result: 'success' });
      res.json({ success: true, data: result });
    } catch (err) {
      authAttemptsTotal.inc({ type: 'login', result: 'failure' });
      next(err);
    }
  }

  async refresh(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new RefreshToken(userRepo, tokenService);
      const result = await useCase.execute({
        refreshToken: req.body.refreshToken,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new GetMe(userRepo);
      const result = await useCase.execute({ tenantId, userId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new LogoutUser(userRepo);
      await useCase.execute({ tenantId, userId });
      res.json({ success: true, data: { message: 'Logged out successfully' } });
    } catch (err) {
      next(err);
    }
  }

  async sendOtp(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new SendOtp(userRepo, passwordService, emailService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
        password: req.body.password,
      });
      authAttemptsTotal.inc({ type: 'send_otp', result: 'success' });
      res.json({ success: true, data: result });
    } catch (err) {
      authAttemptsTotal.inc({ type: 'send_otp', result: 'failure' });
      next(err);
    }
  }

  async verifyOtp(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new VerifyOtp(userRepo, tokenService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
        otp: req.body.otp,
      });
      authAttemptsTotal.inc({ type: 'verify_otp', result: 'success' });
      res.json({ success: true, data: result });
    } catch (err) {
      authAttemptsTotal.inc({ type: 'verify_otp', result: 'failure' });
      next(err);
    }
  }

  async resendOtp(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ResendOtp(userRepo, emailService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
      });
      authAttemptsTotal.inc({ type: 'resend_otp', result: 'success' });
      res.json({ success: true, data: result });
    } catch (err) {
      authAttemptsTotal.inc({ type: 'resend_otp', result: 'failure' });
      next(err);
    }
  }
}
