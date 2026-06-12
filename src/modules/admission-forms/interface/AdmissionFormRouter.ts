import { Router } from 'express';
import { AdmissionFormController } from './AdmissionFormController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  submitAdmissionFormSchema,
  getAdmissionFormSchema,
} from './schemas/admissionFormSchemas.js';

const controller = new AdmissionFormController();
const router = Router();

router.post(
  '/',
  authGuard as any,
  validate(submitAdmissionFormSchema),
  (req, res, next) => controller.submit(req as any, res, next),
);

router.get(
  '/:studentId',
  authGuard as any,
  validate(getAdmissionFormSchema),
  (req, res, next) => controller.getByStudent(req as any, res, next),
);

export { router as admissionFormRouter };
