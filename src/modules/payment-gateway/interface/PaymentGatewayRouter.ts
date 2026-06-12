import { Router } from 'express';
import { PaymentGatewayController } from './PaymentGatewayController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  initiatePaymentSchema,
  paymentCallbackSchema,
  listPaymentTransactionsSchema,
  getPaymentTransactionSchema,
} from './schemas/paymentGatewaySchemas.js';

const controller = new PaymentGatewayController();
const router = Router();

// Initiate payment (authenticated)
router.post(
  '/initiate',
  authGuard as any,
  validate(initiatePaymentSchema),
  (req, res, next) => controller.initiate(req as any, res, next),
);

// Payment success callback (no auth — called by Easebuzz)
router.post(
  '/success',
  validate(paymentCallbackSchema),
  (req, res, next) => controller.success(req as any, res, next),
);

// Payment failure callback (no auth — called by Easebuzz)
router.post(
  '/failure',
  validate(paymentCallbackSchema),
  (req, res, next) => controller.failure(req as any, res, next),
);

// List all transactions (admin, authenticated)
router.get(
  '/',
  authGuard as any,
  validate(listPaymentTransactionsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

// Get single transaction (authenticated)
router.get(
  '/:id',
  authGuard as any,
  validate(getPaymentTransactionSchema),
  (req, res, next) => controller.getById(req as any, res, next),
);

export { router as paymentGatewayRouter };
