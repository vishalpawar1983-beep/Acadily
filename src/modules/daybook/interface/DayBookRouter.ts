import { Router } from 'express';
import { DayBookController } from './DayBookController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createAccountSchema,
  listAccountsSchema,
  getAccountSchema,
  updateAccountSchema,
  deleteAccountSchema,
  createEntrySchema,
  listEntriesSchema,
  getEntrySchema,
  updateEntrySchema,
  deleteEntrySchema,
} from './schemas/dayBookSchemas.js';

const controller = new DayBookController();
const router = Router();

// ── Account routes ──────────────────────────────────────────
router.post(
  '/accounts',
  authGuard as any,
  validate(createAccountSchema),
  (req, res, next) => controller.createAccount(req as any, res, next),
);

router.get(
  '/accounts',
  authGuard as any,
  validate(listAccountsSchema),
  (req, res, next) => controller.listAccounts(req as any, res, next),
);

router.get(
  '/accounts/:id',
  authGuard as any,
  validate(getAccountSchema),
  (req, res, next) => controller.getAccount(req as any, res, next),
);

router.put(
  '/accounts/:id',
  authGuard as any,
  validate(updateAccountSchema),
  (req, res, next) => controller.updateAccount(req as any, res, next),
);

router.delete(
  '/accounts/:id',
  authGuard as any,
  validate(deleteAccountSchema),
  (req, res, next) => controller.deleteAccount(req as any, res, next),
);

// ── Entry routes ────────────────────────────────────────────
router.post(
  '/entries',
  authGuard as any,
  validate(createEntrySchema),
  (req, res, next) => controller.createEntry(req as any, res, next),
);

router.get(
  '/entries',
  authGuard as any,
  validate(listEntriesSchema),
  (req, res, next) => controller.listEntries(req as any, res, next),
);

router.get(
  '/entries/:id',
  authGuard as any,
  validate(getEntrySchema),
  (req, res, next) => controller.getEntry(req as any, res, next),
);

router.put(
  '/entries/:id',
  authGuard as any,
  validate(updateEntrySchema),
  (req, res, next) => controller.updateEntry(req as any, res, next),
);

router.delete(
  '/entries/:id',
  authGuard as any,
  validate(deleteEntrySchema),
  (req, res, next) => controller.deleteEntry(req as any, res, next),
);

export { router as dayBookRouter };
