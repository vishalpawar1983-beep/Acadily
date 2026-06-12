import { Router } from 'express';
import { TenantController } from './TenantController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard, requireRole } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createTenantSchema,
  updateTenantSchema,
  getTenantSchema,
  listTenantsSchema,
  deleteTenantSchema,
} from './schemas/tenantSchemas.js';

const controller = new TenantController();
const router = Router();

// All tenant routes require authentication + SuperAdmin or Admin role
router.use(authGuard as any, requireRole('SuperAdmin', 'Admin') as any);

router.post('/', validate(createTenantSchema), (req, res, next) =>
  controller.create(req as any, res, next),
);

router.get('/', validate(listTenantsSchema), (req, res, next) =>
  controller.list(req as any, res, next),
);

router.get('/:identifier', validate(getTenantSchema), (req, res, next) =>
  controller.getOne(req as any, res, next),
);

router.patch('/:id', validate(updateTenantSchema), (req, res, next) =>
  controller.update(req as any, res, next),
);

router.delete('/:id', validate(deleteTenantSchema), (req, res, next) =>
  controller.delete(req as any, res, next),
);

export { router as tenantRouter };
