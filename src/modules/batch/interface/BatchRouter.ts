import { Router } from 'express';
import { BatchController } from './BatchController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { trainerContext } from '../../../shared/infrastructure/middleware/trainerContext.js';
import {
  createBatchSchema,
  listBatchesSchema,
  getBatchSchema,
  updateBatchSchema,
  addStudentSchema,
  removeStudentSchema,
  deleteBatchSchema,
  getStudentProgressSchema,
  updateSubjectStatusSchema,
  updateBatchStatusSchema,
  listBatchesByCompanySchema,
  listPendingBatchesSchema,
} from './schemas/batchSchemas.js';

const controller = new BatchController();
const router = Router();

// ── Company filter (must be before /:id) ────────────────────
router.get(
  '/company/:companyId',
  authGuard as any,
  trainerContext as any,
  validate(listBatchesByCompanySchema),
  (req, res, next) => controller.listByCompany(req as any, res, next),
);

// ── Pending batches (must be before /:id) ────────────────────
router.get(
  '/pending',
  authGuard as any,
  trainerContext as any,
  validate(listPendingBatchesSchema),
  (req, res, next) => controller.listPending(req as any, res, next),
);

router.post(
  '/',
  authGuard as any,
  trainerContext as any,
  validate(createBatchSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  trainerContext as any,
  validate(listBatchesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  trainerContext as any,
  validate(getBatchSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  trainerContext as any,
  validate(updateBatchSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  trainerContext as any,
  validate(deleteBatchSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

router.patch(
  '/:id/status',
  authGuard as any,
  trainerContext as any,
  validate(updateBatchStatusSchema),
  (req, res, next) => controller.updateBatchStatus(req as any, res, next),
);

router.post(
  '/:id/students',
  authGuard as any,
  trainerContext as any,
  validate(addStudentSchema),
  (req, res, next) => controller.addStudent(req as any, res, next),
);

router.get(
  '/:id/students/:studentId/progress',
  authGuard as any,
  trainerContext as any,
  validate(getStudentProgressSchema),
  (req, res, next) => controller.getStudentProgress(req as any, res, next),
);

router.put(
  '/:id/students/:studentId/subjects/:subjectId',
  authGuard as any,
  trainerContext as any,
  validate(updateSubjectStatusSchema),
  (req, res, next) => controller.updateSubjectStatus(req as any, res, next),
);

router.delete(
  '/:id/students/:studentId',
  authGuard as any,
  trainerContext as any,
  validate(removeStudentSchema),
  (req, res, next) => controller.removeStudent(req as any, res, next),
);

export { router as batchRouter };
