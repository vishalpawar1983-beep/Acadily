import { Router } from 'express';
import { PaymentOptionController } from './PaymentOptionController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createPaymentOptionSchema,
  listPaymentOptionsSchema,
  updatePaymentOptionSchema,
  deletePaymentOptionSchema,
} from './schemas/paymentOptionSchemas.js';

const controller = new PaymentOptionController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createPaymentOptionSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listPaymentOptionsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updatePaymentOptionSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deletePaymentOptionSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as paymentOptionRouter };
