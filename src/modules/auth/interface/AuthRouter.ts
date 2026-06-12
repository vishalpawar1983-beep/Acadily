import { Router } from 'express';
import { AuthController } from './AuthController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from './schemas/authSchemas.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { authRateLimiter } from '../../../shared/infrastructure/middleware/rateLimiter.js';

const controller = new AuthController();
const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), (req, res, next) =>
  controller.register(req as any, res, next),
);

router.post('/login', authRateLimiter, validate(loginSchema), (req, res, next) =>
  controller.login(req as any, res, next),
);

router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), (req, res, next) =>
  controller.refresh(req as any, res, next),
);

router.get('/me', authGuard as any, (req, res, next) =>
  controller.me(req as any, res, next),
);

router.post('/logout', authGuard as any, (req, res, next) =>
  controller.logout(req as any, res, next),
);

router.post('/send-otp', authRateLimiter, validate(sendOtpSchema), (req, res, next) =>
  controller.sendOtp(req as any, res, next),
);

router.post('/verify-otp', authRateLimiter, validate(verifyOtpSchema), (req, res, next) =>
  controller.verifyOtp(req as any, res, next),
);

router.post('/resend-otp', authRateLimiter, validate(resendOtpSchema), (req, res, next) =>
  controller.resendOtp(req as any, res, next),
);

export { router as authRouter };
