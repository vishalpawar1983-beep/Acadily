import { Router } from 'express';
import { FeeController } from './FeeController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  recordPaymentSchema,
  listFeesSchema,
  getStudentFeesSchema,
  getFeePaymentSchema,
  updateFeePaymentSchema,
  deleteFeePaymentSchema,
  getNotPaidStudentsSchema,
} from './schemas/feeSchemas.js';

const controller = new FeeController();
const router = Router();

// Static routes must come before parameterized routes
router.get(
  '/all',
  authGuard as any,
  (req, res, next) => controller.listAllFees(req as any, res, next),
);

router.post(
  '/not-paid',
  authGuard as any,
  validate(getNotPaidStudentsSchema),
  (req, res, next) => controller.getNotPaidStudents(req as any, res, next),
);

router.post(
  '/',
  authGuard as any,
  validate(recordPaymentSchema),
  (req, res, next) => controller.recordPayment(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listFeesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getStudentFeesSchema),
  (req, res, next) => controller.getStudentFees(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getFeePaymentSchema),
  (req, res, next) => controller.getFeePayment(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateFeePaymentSchema),
  (req, res, next) => controller.updateFeePayment(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteFeePaymentSchema),
  (req, res, next) => controller.deleteFeePayment(req as any, res, next),
);

export { router as feeRouter };
