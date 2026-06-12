import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { MarkAttendance } from '../application/MarkAttendance.js';
import { GetBatchAttendance } from '../application/GetBatchAttendance.js';
import { GetStudentAttendance } from '../application/GetStudentAttendance.js';
import { MongoAttendanceRepository } from '../infrastructure/MongoAttendanceRepository.js';
import { MongoBatchRepository } from '../../batch/infrastructure/MongoBatchRepository.js';
import { ValidationError, ForbiddenError } from '../../../shared/domain/errors.js';

const attendanceRepo = new MongoAttendanceRepository();
const batchRepo = new MongoBatchRepository();

function isTrainer(req: AppRequest): boolean {
  return req.user?.role === 'Trainer';
}

/**
 * Verifies the batch exists and belongs to the logged-in trainer.
 * Returns true on success, calls next(err) and returns false on failure.
 */
async function assertTrainerOwnsBatch(
  req: AppRequest,
  next: NextFunction,
  tenantId: string,
  batchId: string,
): Promise<boolean> {
  const { trainerEntityId } = req;
  if (!trainerEntityId) {
    next(new ForbiddenError('Trainer account is not linked to a Trainer profile. Contact an administrator.'));
    return false;
  }
  const batch = await batchRepo.findById(tenantId, batchId);
  if (!batch) {
    next(new ValidationError(`Batch ${batchId} not found`));
    return false;
  }
  if (batch.trainer !== trainerEntityId) {
    next(new ForbiddenError('Trainers can only mark or view attendance for their own batches'));
    return false;
  }
  return true;
}

export class AttendanceController {
  async markAttendance(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      // Trainers may only mark attendance for their own batches
      if (isTrainer(req)) {
        const allowed = await assertTrainerOwnsBatch(req, next, tenantId, req.body.batchId);
        if (!allowed) return;
      }

      const useCase = new MarkAttendance(attendanceRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.body.batchId,
        studentId: req.body.studentId,
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
        status: req.body.status,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getBatchAttendance(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      // Trainers may only view attendance for their own batches
      if (isTrainer(req)) {
        const allowed = await assertTrainerOwnsBatch(req, next, tenantId, req.params.batchId as string);
        if (!allowed) return;
      }

      const useCase = new GetBatchAttendance(attendanceRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.batchId as string,
        month: Number(req.query.month),
        year: Number(req.query.year),
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudentAttendance(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      // Trainers can view any student's attendance globally (no batch restriction here)
      const useCase = new GetStudentAttendance(attendanceRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
        month: req.query.month !== undefined ? Number(req.query.month) : undefined,
        year: req.query.year !== undefined ? Number(req.query.year) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
