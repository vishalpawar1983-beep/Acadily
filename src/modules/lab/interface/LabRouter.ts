import { Router } from 'express';
import { LabController } from './LabController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createLabSchema,
  listLabsSchema,
  getLabSchema,
  updateLabSchema,
  deleteLabSchema,
} from './schemas/labSchemas.js';

const controller = new LabController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createLabSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listLabsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getLabSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateLabSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteLabSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as labRouter };
