import { Router } from 'express';
import { BatchCategoryController } from './BatchCategoryController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createBatchCategorySchema,
  listBatchCategoriesSchema,
  getBatchCategorySchema,
  updateBatchCategorySchema,
  deleteBatchCategorySchema,
} from './schemas/batchCategorySchemas.js';

const controller = new BatchCategoryController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createBatchCategorySchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listBatchCategoriesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getBatchCategorySchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateBatchCategorySchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteBatchCategorySchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as batchCategoryRouter };
