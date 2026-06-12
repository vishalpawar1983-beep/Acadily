import { Router } from 'express';
import { TeacherController } from './TeacherController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createTeacherSchema,
  listTeachersSchema,
  getTeacherSchema,
  updateTeacherSchema,
  deleteTeacherSchema,
} from './schemas/teacherSchemas.js';

const controller = new TeacherController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createTeacherSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listTeachersSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getTeacherSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateTeacherSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteTeacherSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as teacherRouter };
