import { Router } from 'express';
import { RbacController } from './RbacController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createRoleAccessSchema,
  listRoleAccessSchema,
  getRoleAccessSchema,
  getRoleAccessByRoleSchema,
  updateRoleAccessSchema,
} from './schemas/rbacSchemas.js';

const controller = new RbacController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(createRoleAccessSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listRoleAccessSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/by-role/:role',
  authGuard as any,
  validate(getRoleAccessByRoleSchema),
  (req, res, next) => controller.getByRole(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getRoleAccessSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateRoleAccessSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

export { router as rbacRouter };
