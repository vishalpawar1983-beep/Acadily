import { Router } from 'express';
import { RollNumberController } from './RollNumberController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { updateRollNumberSchema } from './schemas/rollNumberSchemas.js';

const controller = new RollNumberController();
const router = Router();

router.get(
  '/next',
  authGuard as any,
  (req, res, next) => controller.getNext(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  (req, res, next) => controller.getCounter(req as any, res, next),
);

router.put(
  '/',
  authGuard as any,
  validate(updateRollNumberSchema),
  (req, res, next) => controller.updateCounter(req as any, res, next),
);

export { router as rollNumberRouter };
