import { Router } from 'express';
import { CustomFormController } from './CustomFormController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createFormSchema,
  listFormsSchema,
  getFormSchema,
  updateFormSchema,
  deleteFormSchema,
  submitFormSchema,
  publicSubmitFormSchema,
  listSubmissionsSchema,
  getSubmissionSchema,
  updateSubmissionSchema,
  deleteSubmissionSchema,
  createSelectSchema,
  listSelectsSchema,
  getSelectSchema,
  updateSelectSchema,
} from './schemas/customFormSchemas.js';

const controller = new CustomFormController();
const router = Router();

router.post(
  '/forms',
  authGuard as any,
  validate(createFormSchema),
  (req, res, next) => controller.createForm(req as any, res, next),
);

router.get(
  '/forms',
  authGuard as any,
  validate(listFormsSchema),
  (req, res, next) => controller.listForms(req as any, res, next),
);

router.get(
  '/forms/:id',
  authGuard as any,
  validate(getFormSchema),
  (req, res, next) => controller.getForm(req as any, res, next),
);

router.put(
  '/forms/:id',
  authGuard as any,
  validate(updateFormSchema),
  (req, res, next) => controller.updateForm(req as any, res, next),
);

router.delete(
  '/forms/:id',
  authGuard as any,
  validate(deleteFormSchema),
  (req, res, next) => controller.deleteForm(req as any, res, next),
);

router.post(
  '/forms/:formId/public-submit',
  validate(publicSubmitFormSchema),
  (req, res, next) => controller.publicSubmitForm(req as any, res, next),
);

router.post(
  '/forms/:formId/submissions',
  authGuard as any,
  validate(submitFormSchema),
  (req, res, next) => controller.submitForm(req as any, res, next),
);

router.get(
  '/forms/:formId/submissions',
  authGuard as any,
  validate(listSubmissionsSchema),
  (req, res, next) => controller.listSubmissions(req as any, res, next),
);

router.get(
  '/forms/:formId/submissions/:id',
  authGuard as any,
  validate(getSubmissionSchema),
  (req, res, next) => controller.getSubmission(req as any, res, next),
);

router.put(
  '/forms/:formId/submissions/:id',
  authGuard as any,
  validate(updateSubmissionSchema),
  (req, res, next) => controller.updateSubmission(req as any, res, next),
);

router.delete(
  '/forms/:formId/submissions/:id',
  authGuard as any,
  validate(deleteSubmissionSchema),
  (req, res, next) => controller.deleteSubmission(req as any, res, next),
);

// ── Default Select routes ───────────────────────────────────
router.post(
  '/selects',
  authGuard as any,
  validate(createSelectSchema),
  (req, res, next) => controller.createSelect(req as any, res, next),
);

router.get(
  '/selects',
  authGuard as any,
  validate(listSelectsSchema),
  (req, res, next) => controller.listSelects(req as any, res, next),
);

router.get(
  '/selects/:id',
  authGuard as any,
  validate(getSelectSchema),
  (req, res, next) => controller.getSelect(req as any, res, next),
);

router.put(
  '/selects/:id',
  authGuard as any,
  validate(updateSelectSchema),
  (req, res, next) => controller.updateSelect(req as any, res, next),
);

export { router as customFormRouter };
