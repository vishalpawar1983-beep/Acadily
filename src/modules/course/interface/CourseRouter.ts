import { Router } from 'express';
import { CourseController } from './CourseController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createCourseSchema,
  getCourseSchema,
  listCoursesSchema,
  updateCourseSchema,
  deleteCourseSchema,
} from './schemas/courseSchemas.js';

const controller = new CourseController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createCourseSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCoursesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCourseSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCourseSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteCourseSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as courseRouter };
