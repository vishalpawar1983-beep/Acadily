import { Router } from 'express';
import { CategoryController } from './CategoryController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createCategorySchema,
  getCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
  deleteCategorySchema,
} from './schemas/categorySchemas.js';

const controller = new CategoryController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createCategorySchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCategoriesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCategorySchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCategorySchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteCategorySchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as categoryRouter };
