import { Router } from 'express';
import { TrainerController } from './TrainerController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createTrainerSchema,
  listTrainersSchema,
  getTrainerSchema,
  updateTrainerSchema,
  deleteTrainerSchema,
} from './schemas/trainerSchemas.js';

const controller = new TrainerController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createTrainerSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listTrainersSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getTrainerSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateTrainerSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteTrainerSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as trainerRouter };
