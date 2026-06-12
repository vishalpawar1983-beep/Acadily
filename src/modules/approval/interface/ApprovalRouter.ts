import { Router } from 'express';
import { ApprovalController } from './ApprovalController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createApprovalSchema,
  listApprovalsSchema,
  listPendingSchema,
  getApprovalSchema,
  getByStudentSchema,
  reviewApprovalSchema,
} from './schemas/approvalSchemas.js';

const controller = new ApprovalController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createApprovalSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listApprovalsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/pending',
  authGuard as any,
  validate(listPendingSchema),
  (req, res, next) => controller.listPending(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getByStudentSchema),
  (req, res, next) => controller.getByStudent(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getApprovalSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id/review',
  authGuard as any,
  validate(reviewApprovalSchema),
  (req, res, next) => controller.review(req as any, res, next),
);

export { router as approvalRouter };
