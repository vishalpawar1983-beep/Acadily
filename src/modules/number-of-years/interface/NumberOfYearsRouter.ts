import { Router } from 'express';
import { NumberOfYearsController } from './NumberOfYearsController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createNumberOfYearsSchema,
  getNumberOfYearsSchema,
  listNumberOfYearsSchema,
  updateNumberOfYearsSchema,
  deleteNumberOfYearsSchema,
} from './schemas/numberOfYearsSchemas.js';

const controller = new NumberOfYearsController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createNumberOfYearsSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listNumberOfYearsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getNumberOfYearsSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateNumberOfYearsSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteNumberOfYearsSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as numberOfYearsRouter };
