import { Router } from 'express';
import { NoteController } from './NoteController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import {
  createNoteSchema,
  listNotesSchema,
  getNoteSchema,
  getByStudentSchema,
  updateNoteSchema,
  deleteNoteSchema,
} from './schemas/noteSchemas.js';

const controller = new NoteController();
const router = Router();

// Must come before /:id to avoid route collision
router.get(
  '/reminders',
  authGuard as any,
  (req, res, next) => controller.getPendingReminders(req as any, res, next),
);

router.post(
  '/',
  authGuard as any,
  validate(createNoteSchema),
  (req, res, next) => controller.create(req as any, res, next),
);

router.get(
  '/',
  authGuard as any,
  validate(listNotesSchema),
  (req, res, next) => controller.list(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  validate(getByStudentSchema),
  (req, res, next) => controller.getByStudent(req as any, res, next),
);

router.get(
  '/:id',
  authGuard as any,
  validate(getNoteSchema),
  (req, res, next) => controller.get(req as any, res, next),
);

router.put(
  '/:id',
  authGuard as any,
  validate(updateNoteSchema),
  (req, res, next) => controller.update(req as any, res, next),
);

router.delete(
  '/:id',
  authGuard as any,
  validate(deleteNoteSchema),
  (req, res, next) => controller.delete(req as any, res, next),
);

export { router as noteRouter };
