import { Router } from 'express';
import { SettingsController } from './SettingsController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  updateSettingsSchema,
  updateEmailSuggestionSchema,
  updateWelcomeEmailSchema,
  updateWhatsappMessageSchema,
  updateStudentGstSchema,
  updateReminderDatesSchema,
  updateEmailRemainderSchema,
  updateLateFeesSchema,
  updateSmtpSchema,
} from './schemas/settingsSchemas.js';

const controller = new SettingsController();
const router = Router();

// ── Main Settings ──
router.get(
  '/',
  authGuard as any,
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/',
  authGuard as any,
  validate(updateSettingsSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

// ── Email Suggestion ──
router.get(
  '/email-suggestion',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'emailSuggestion'),
);

router.put(
  '/email-suggestion',
  authGuard as any,
  validate(updateEmailSuggestionSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'emailSuggestion', req.body),
);

// ── Welcome Email ──
router.get(
  '/welcome-email',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'welcomeEmail'),
);

router.put(
  '/welcome-email',
  authGuard as any,
  validate(updateWelcomeEmailSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'welcomeEmail', req.body),
);

// ── WhatsApp Message ──
router.get(
  '/whatsapp-message',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'whatsappMessage'),
);

router.put(
  '/whatsapp-message',
  authGuard as any,
  validate(updateWhatsappMessageSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'whatsappMessage', req.body),
);

// ── Student GST ──
router.get(
  '/student-gst',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'studentGst'),
);

router.put(
  '/student-gst',
  authGuard as any,
  validate(updateStudentGstSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'studentGst', req.body),
);

// ── Late Fees ──
router.get(
  '/late-fees',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'lateFees'),
);

router.put(
  '/late-fees',
  authGuard as any,
  validate(updateLateFeesSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'lateFees', req.body),
);

// ── Reminder Dates ──
router.get(
  '/reminder-dates',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'reminderDates'),
);

router.put(
  '/reminder-dates',
  authGuard as any,
  validate(updateReminderDatesSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'reminderDates', req.body.reminderDates),
);

// ── Email Remainder ──
router.get(
  '/email-remainder',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'emailRemainder'),
);

router.put(
  '/email-remainder',
  authGuard as any,
  validate(updateEmailRemainderSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'emailRemainder', req.body),
);

// ── SMTP Credentials (per-tenant email sender) ──
router.get(
  '/smtp',
  authGuard as any,
  (req, res, next) => controller.getSection(req as any, res, next, 'smtp'),
);

router.put(
  '/smtp',
  authGuard as any,
  validate(updateSmtpSchema),
  (req, res, next) => controller.updateSection(req as any, res, next, 'smtp', req.body),
);

export { router as settingsRouter };
