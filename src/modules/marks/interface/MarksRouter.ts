import { Router } from 'express';
import { MarksController } from './MarksController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  recordMarksSchema,
  listMarksSchema,
  getMarksSchema,
  getStudentMarksSchema,
  updateMarksSchema,
  assignSubjectsSchema,
  bulkUpdateMarksSchema,
  getStudentCourseMarksSchema,
} from './schemas/marksSchemas.js';

const controller = new MarksController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(recordMarksSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.post(
  '/assign',
  authGuard as any,
  validate(assignSubjectsSchema),
  (req, res, next) => controller.assignSubjects(req as any, res, next),
);

router.put(
  '/bulk',
  authGuard as any,
  validate(bulkUpdateMarksSchema),
  (req, res, next) => controller.bulkUpdate(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listMarksSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/student/:studentId/course/:courseId',
  authGuard as any,
  validate(getStudentCourseMarksSchema),
  (req, res, next) => controller.getStudentCourseMarks(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getStudentMarksSchema),
  (req, res, next) => controller.listByStudent(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getMarksSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateMarksSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

export { router as marksRouter };
