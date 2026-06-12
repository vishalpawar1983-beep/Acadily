import { Router } from 'express';
import { CourseTypeController } from './CourseTypeController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createCourseTypeSchema,
  getCourseTypeSchema,
  listCourseTypesSchema,
  updateCourseTypeSchema,
  deleteCourseTypeSchema,
} from './schemas/courseTypeSchemas.js';

const controller = new CourseTypeController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createCourseTypeSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCourseTypesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCourseTypeSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCourseTypeSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteCourseTypeSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as courseTypeRouter };
