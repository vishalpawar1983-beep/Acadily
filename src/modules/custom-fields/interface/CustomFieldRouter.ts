import { Router } from 'express';
import { CustomFieldController } from './CustomFieldController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createCustomFieldSchema,
  listCustomFieldsSchema,
  getCustomFieldSchema,
  updateCustomFieldSchema,
  deleteCustomFieldSchema,
} from './schemas/customFieldSchemas.js';

const controller = new CustomFieldController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createCustomFieldSchema),
  (req, res, next) => controller.createField(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listCustomFieldsSchema),
  (req, res, next) => controller.listFields(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getCustomFieldSchema),
  (req, res, next) => controller.getField(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateCustomFieldSchema),
  (req, res, next) => controller.updateField(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteCustomFieldSchema),
  (req, res, next) => controller.deleteField(req as any, res, next),
);

export { router as customFieldRouter };
