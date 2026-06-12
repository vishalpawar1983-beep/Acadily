import { Router } from 'express';
import { FormLayoutController } from './FormLayoutController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  saveColumnsSchema,
  getColumnsSchema,
  deleteColumnSchema,
  saveRowsSchema,
  getRowsSchema,
  deleteRowSchema,
} from './schemas/formLayoutSchemas.js';

const controller = new FormLayoutController();
const router = Router();

// ── Column routes ───────────────────────────────────────────
router.post(
  '/columns',
  authGuard as any,
  validate(saveColumnsSchema),
  (req, res, next) => controller.saveColumns(req as any, res, next),
);

router.get(
  '/columns',
  authGuard as any,
  validate(getColumnsSchema),
  (req, res, next) => controller.getColumns(req as any, res, next),
);

router.delete(
  '/columns/:id',
  authGuard as any,
  validate(deleteColumnSchema),
  (req, res, next) => controller.deleteColumn(req as any, res, next),
);

// ── Row routes ──────────────────────────────────────────────
router.post(
  '/rows',
  authGuard as any,
  validate(saveRowsSchema),
  (req, res, next) => controller.saveRows(req as any, res, next),
);

router.get(
  '/rows',
  authGuard as any,
  validate(getRowsSchema),
  (req, res, next) => controller.getRows(req as any, res, next),
);

router.delete(
  '/rows/:id',
  authGuard as any,
  validate(deleteRowSchema),
  (req, res, next) => controller.deleteRow(req as any, res, next),
);

export { router as formLayoutRouter };
