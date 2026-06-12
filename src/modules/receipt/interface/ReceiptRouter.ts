import { Router } from 'express';
import { ReceiptController } from './ReceiptController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { updateReceiptCounterSchema } from './schemas/receiptSchemas.js';

const controller = new ReceiptController();
const router = Router();

router.get(
  '/next',
  authGuard as any,
  (req, res, next) => controller.getNext(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/',
  authGuard as any,
  validate(updateReceiptCounterSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

export { router as receiptRouter };
