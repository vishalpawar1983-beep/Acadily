import { Router } from 'express';
import { EmailLogController } from './EmailLogController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { listEmailLogsSchema } from './schemas/emailLogSchemas.js';

const controller = new EmailLogController();
const router = Router();

router.get(
  '/',
  authGuard as any,
  validate(listEmailLogsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

export { router as emailLogRouter };
