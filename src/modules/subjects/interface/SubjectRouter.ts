import { Router } from 'express';
import { SubjectController } from './SubjectController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createSubjectSchema,
  listSubjectsSchema,
  getSubjectSchema,
  getSubjectsByCourseSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
} from './schemas/subjectSchemas.js';

const controller = new SubjectController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createSubjectSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listSubjectsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/course/:courseId',
  authGuard as any,
  validate(getSubjectsByCourseSchema),
  (req, res, next) => controller.getByCourse(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getSubjectSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateSubjectSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteSubjectSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as subjectRouter };
