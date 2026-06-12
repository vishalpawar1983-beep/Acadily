import { Router } from 'express';
import { IssueController } from './IssueController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createIssueSchema,
  listIssuesSchema,
  getIssueSchema,
  getByStudentSchema,
  updateIssueSchema,
  updateIssueStatusSchema,
  deleteIssueSchema,
  toggleDashboardSchema,
  getDashboardByStudentSchema,
} from './schemas/issueSchemas.js';

const controller = new IssueController();
const router = Router();

// ── Dashboard routes (must be before /:id) ──────────────────
router.post(
  '/dashboard',
  authGuard as any,
  validate(toggleDashboardSchema),
  (req, res, next) => controller.toggleDashboard(req as any, res, next),
);

router.get(
  '/dashboard',
  authGuard as any,
  (req, res, next) => controller.listDashboard(req as any, res, next),
);

router.get(
  '/dashboard/:studentId',
  authGuard as any,
  validate(getDashboardByStudentSchema),
  (req, res, next) => controller.getDashboardByStudent(req as any, res, next),
);

router.post(
  '/',
  authGuard as any,
  validate(createIssueSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listIssuesSchema),
  (req, res, next) => controller.list(req as any, res, next),
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
  validate(getIssueSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/status/:id',
  authGuard as any,
  validate(updateIssueStatusSchema),
  (req, res, next) => controller.updateStatus(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateIssueSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteIssueSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as issueRouter };
