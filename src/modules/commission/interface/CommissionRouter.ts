import { Router } from 'express';
import { CommissionController } from './CommissionController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createCommissionSchema,
  listCommissionsSchema,
  getCommissionSchema,
  updateCommissionSchema,
  deleteCommissionSchema,
} from './schemas/commissionSchemas.js';

const controller = new CommissionController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createCommissionSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCommissionsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCommissionSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCommissionSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteCommissionSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as commissionRouter };
