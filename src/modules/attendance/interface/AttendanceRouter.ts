import { Router } from 'express';
import { AttendanceController } from './AttendanceController.js';
import { validate } from '../../../shared/infrastructure/middleware/inputValidator.js';
import { authGuard } from '../../../shared/infrastructure/middleware/authGuard.js';
import { trainerContext } from '../../../shared/infrastructure/middleware/trainerContext.js';
import {
  markAttendanceSchema,
  getBatchAttendanceSchema,
  getStudentAttendanceSchema,
} from './schemas/attendanceSchemas.js';

const controller = new AttendanceController();
const router = Router();

router.post(
  '/mark',
  authGuard as any,
  trainerContext as any,
  validate(markAttendanceSchema),
  (req, res, next) => controller.markAttendance(req as any, res, next),
);

router.get(
  '/batch/:batchId',
  authGuard as any,
  trainerContext as any,
  validate(getBatchAttendanceSchema),
  (req, res, next) => controller.getBatchAttendance(req as any, res, next),
);

router.get(
  '/student/:studentId',
  authGuard as any,
  trainerContext as any,
  validate(getStudentAttendanceSchema),
  (req, res, next) => controller.getStudentAttendance(req as any, res, next),
);

export { router as attendanceRouter };
