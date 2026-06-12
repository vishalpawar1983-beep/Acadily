import { Router } from 'express';
import { TimingController } from './TimingController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createTimingSchema,
  listTimingsSchema,
  getTimingSchema,
  updateTimingSchema,
  deleteTimingSchema,
} from './schemas/timingSchemas.js';

const controller = new TimingController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createTimingSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listTimingsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getTimingSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateTimingSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteTimingSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as timingRouter };
