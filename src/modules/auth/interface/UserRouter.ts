import { Router } from 'express';
import { UserController } from './UserController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard, requireRole } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createUserSchema,
  listUsersSchema,
  getUserByIdSchema,
  updateUserSchema,
  deleteUserSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from './schemas/authSchemas.js';

const controller = new UserController();
const router = Router();

// Password reset routes (no auth required)
router.post('/request-password-reset', validate(requestPasswordResetSchema), (req, res, next) =>
  controller.requestPasswordReset(req as any, res, next),
);

router.post('/reset-password', validate(resetPasswordSchema), (req, res, next) =>
  controller.resetPassword(req as any, res, next),
);

// Protected routes
router.post(
  '/',
  authGuard as any,
  requireRole('SuperAdmin', 'Admin') as any,
  validate(createUserSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  requireRole('SuperAdmin', 'Admin') as any,
  validate(listUsersSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  requireRole('SuperAdmin', 'Admin') as any,
  validate(getUserByIdSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  requireRole('SuperAdmin') as any,
  validate(updateUserSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  requireRole('SuperAdmin', 'Admin') as any,
  validate(deleteUserSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as userRouter };
