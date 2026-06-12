import { Router } from 'express';
import { InstallmentController } from './InstallmentController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createInstallmentSchema,
  listInstallmentsSchema,
  getInstallmentSchema,
  getStudentInstallmentsSchema,
  markPaidSchema,
  updateInstallmentSchema,
  listInstallmentsByCompanySchema,
  calculateLateFeesSchema,
} from './schemas/installmentSchemas.js';

const controller = new InstallmentController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createInstallmentSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listInstallmentsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getStudentInstallmentsSchema),
  (req, res, next) => controller.listByStudent(req as any, res, next),
);

router.get(
  '/overdue',
  authGuard as any,
  (req, res, next) => controller.listOverdue(req as any, res, next),
);

router.get(
  '/overdue/late-fees',
  authGuard as any,
  (req, res, next) => controller.listOverdueWithLateFees(req as any, res, next),
);

router.post(
  '/calculate-late-fees',
  authGuard as any,
  validate(calculateLateFeesSchema),
  (req, res, next) => controller.calculateLateFees(req as any, res, next),
);

router.get(
  '/company/:companyId',
  authGuard as any,
  validate(listInstallmentsByCompanySchema),
  (req, res, next) => controller.listByCompany(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getInstallmentSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id/pay',
  authGuard as any,
  validate(markPaidSchema),
  (req, res, next) => controller.markPaid(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateInstallmentSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

export { router as installmentRouter };
