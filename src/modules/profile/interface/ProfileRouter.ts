import { Router } from 'express';
import { ProfileController } from './ProfileController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { updateProfileSchema } from './schemas/profileSchemas.js';

const controller = new ProfileController();
const router = Router();

router.get(
  '/',
  authGuard as any,
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/',
  authGuard as any,
  validate(updateProfileSchema),
  (req, res, next) => controller.upsert(req as any, res, next),
);

export { router as profileRouter };
