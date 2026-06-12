import { Router } from 'express';
import { EmailTemplateController } from './EmailTemplateController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createTemplateSchema,
  listTemplatesSchema,
  getTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
  sendTemplatedEmailSchema,
} from './schemas/emailTemplateSchemas.js';

const controller = new EmailTemplateController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createTemplateSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listTemplatesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getTemplateSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateTemplateSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteTemplateSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

router.post(
  '/send',
  authGuard as any,
  validate(sendTemplatedEmailSchema),
  (req, res, next) => controller.send(req as any, res, next),
);

export { router as emailTemplateRouter };
