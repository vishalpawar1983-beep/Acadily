import { Router } from 'express';
import { CompletionController } from './CompletionController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  recordCompletionSchema,
  listCompletionsSchema,
  getCompletionSchema,
  getStudentCompletionsSchema,
  updateCompletionSchema,
} from './schemas/completionSchemas.js';

const controller = new CompletionController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(recordCompletionSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCompletionsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getStudentCompletionsSchema),
  (req, res, next) => controller.listByStudent(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCompletionSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCompletionSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

export { router as completionRouter };
