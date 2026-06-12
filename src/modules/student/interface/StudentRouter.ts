import { Router } from 'express';
import { StudentController } from './StudentController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard, requireRole } from '../../../shared/infrastructure/middleware/authGuard.js';
import { uploadSingle } from '../../../shared/infrastructure/middleware/fileUpload.js';
import {
  enrollStudentSchema,
  listStudentsSchema,
  getStudentSchema,
  updateStudentSchema,
  dropOutStudentSchema,
  deleteStudentSchema,
  searchStudentsSchema,
  renewStudentSchema,
  createStudentAlertSchema,
  updateStudentAlertSchema,
  deleteStudentAlertSchema,
  getStudentByEmailSchema,
  listStudentsByCompanySchema,
  listStudentsByCompanyCourseSchema,
  listStudentsForFeesCollectionSchema,
  sendWarningMailSchema,
  sendCancellationMailSchema,
  sendReceiptMailSchema,
  sendBulkMailSchema,
  sendCourseChangeMailSchema,
} from './schemas/studentSchemas.js';

const controller = new StudentController();
const router = Router();

// Static routes must come before /:id to avoid route conflict

router.get(
  '/search',
  authGuard as any,
  validate(searchStudentsSchema),
  (req, res, next) => controller.search(req as any, res, next),
);

router.get(
  '/by-email/:email',
  authGuard as any,
  validate(getStudentByEmailSchema),
  (req, res, next) => controller.getByEmail(req as any, res, next),
);

router.get(
  '/fees-collection',
  authGuard as any,
  validate(listStudentsForFeesCollectionSchema),
  (req, res, next) => controller.listForFeesCollection(req as any, res, next),
);

router.get(
  '/company/:companyId',
  authGuard as any,
  validate(listStudentsByCompanySchema),
  (req, res, next) => controller.listByCompany(req as any, res, next),
);

router.get(
  '/company/:companyId/course/:courseId',
  authGuard as any,
  validate(listStudentsByCompanyCourseSchema),
  (req, res, next) => controller.listByCompanyCourse(req as any, res, next),
);

router.post(
  '/send-bulk-mail',
  authGuard as any,
  validate(sendBulkMailSchema),
  (req, res, next) => controller.sendBulkMail(req as any, res, next),
);

// Alerts routes must come before /:id to avoid route conflict
router.post(
  '/alerts',
  authGuard as any,
  validate(createStudentAlertSchema),
  (req, res, next) => controller.createAlert(req as any, res, next),
);

router.get(
  '/alerts',
  authGuard as any,
  (req, res, next) => controller.listAlerts(req as any, res, next),
);

router.put(
  '/alerts/:id',
  authGuard as any,
  validate(updateStudentAlertSchema),
  (req, res, next) => controller.updateAlert(req as any, res, next),
);

router.delete(
  '/alerts/:id',
  authGuard as any,
  validate(deleteStudentAlertSchema),
  (req, res, next) => controller.deleteAlert(req as any, res, next),
);

router.post(
  '/:id/upload-photo',
  authGuard as any,
  ...uploadSingle('photo', 'students'),
  (req, res, next) => controller.uploadPhoto(req as any, res, next),
);

router.post(
  '/',
  authGuard as any,
  validate(enrollStudentSchema),
  (req, res, next) => controller.enroll(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listStudentsSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getStudentSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateStudentSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.patch(
  '/:id/dropout',
  authGuard as any,
  validate(dropOutStudentSchema),
  (req, res, next) => controller.dropout(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  requireRole('Admin', 'SuperAdmin') as any,
  validate(deleteStudentSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

router.post(
  '/:id/renew',
  authGuard as any,
  validate(renewStudentSchema),
  (req, res, next) => controller.renew(req as any, res, next),
);

router.post(
  '/:id/send-warning-mail',
  authGuard as any,
  validate(sendWarningMailSchema),
  (req, res, next) => controller.sendWarningMail(req as any, res, next),
);

router.post(
  '/:id/send-cancellation-mail',
  authGuard as any,
  validate(sendCancellationMailSchema),
  (req, res, next) => controller.sendCancellationMail(req as any, res, next),
);

router.post(
  '/:id/send-receipt-mail',
  authGuard as any,
  validate(sendReceiptMailSchema),
  (req, res, next) => controller.sendReceiptMail(req as any, res, next),
);

router.post(
  '/:id/send-course-change-mail',
  authGuard as any,
  validate(sendCourseChangeMailSchema),
  (req, res, next) => controller.sendCourseChangeMail(req as any, res, next),
);

export { router as studentRouter };
