import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateBatch } from '../application/CreateBatch.js';
import { GetBatch } from '../application/GetBatch.js';
import { ListBatches } from '../application/ListBatches.js';
import { UpdateBatch } from '../application/UpdateBatch.js';
import { AddStudentToBatch } from '../application/AddStudentToBatch.js';
import { RemoveStudentFromBatch } from '../application/RemoveStudentFromBatch.js';
import { DeleteBatch } from '../application/DeleteBatch.js';
import { GetStudentProgress } from '../application/GetStudentProgress.js';
import { UpdateSubjectStatus } from '../application/UpdateSubjectStatus.js';
import { UpdateBatchStatus } from '../application/UpdateBatchStatus.js';
import { ListPendingBatches } from '../application/ListPendingBatches.js';
import { ListBatchesByCompany } from '../application/ListBatchesByCompany.js';
import { MongoBatchRepository } from '../infrastructure/MongoBatchRepository.js';
import { ValidationError, ForbiddenError } from '../../../shared/domain/errors.js';
import type { Batch } from '../domain/entities/Batch.js';

const batchRepo = new MongoBatchRepository();

function isTrainer(req: AppRequest): boolean {
  return req.user?.role === 'Trainer';
}

/**
 * Verifies the batch exists and belongs to the logged-in trainer.
 * Returns the batch on success or calls next(err) and returns null.
 */
async function assertTrainerOwnsBatch(
  req: AppRequest,
  next: NextFunction,
  tenantId: string,
  batchId: string,
): Promise<Batch | null> {
  const { trainerEntityId } = req;
  if (!trainerEntityId) {
    next(new ForbiddenError('Trainer account is not linked to a Trainer profile. Contact an administrator.'));
    return null;
  }
  const batch = await batchRepo.findById(tenantId, batchId);
  if (!batch) {
    next(new ValidationError(`Batch ${batchId} not found`));
    return null;
  }
  if (batch.trainer !== trainerEntityId) {
    next(new ForbiddenError('Trainers can only access their own batches'));
    return null;
  }
  return batch;
}

export class BatchController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isTrainer(req)) {
        return next(new ForbiddenError('Trainers cannot create batches'));
      }

      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        name: req.body.name,
        courseCategory: req.body.courseCategory,
        course: req.body.course,
        trainer: req.body.trainer,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status,
        students: req.body.students,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
        res.json({ success: true, data: {
          id: batch.id,
          name: batch.name,
          courseCategory: batch.courseCategory,
          course: batch.course,
          trainer: batch.trainer,
          startTime: batch.startTime,
          endTime: batch.endTime,
          startDate: batch.startDate,
          endDate: batch.endDate,
          status: batch.status,
          students: batch.students,
          isActive: batch.isActive,
          createdAt: batch.createdAt,
        }});
        return;
      }

      const useCase = new GetBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListBatches(batchRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        status: req.query.status as 'completed' | 'inProgress' | undefined,
        search: req.query.search as string | undefined,
        // Trainers only see their own batches
        trainerEntityId: isTrainer(req) ? req.trainerEntityId : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isTrainer(req)) {
        return next(new ForbiddenError('Trainers cannot update batch details'));
      }

      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        name: req.body.name,
        courseCategory: req.body.courseCategory,
        course: req.body.course,
        trainer: req.body.trainer,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status,
        isActive: req.body.isActive,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async addStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
      }

      const useCase = new AddStudentToBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        studentId: req.body.studentId,
        subjects: req.body.subjects,
        currentSoftware: req.body.currentSoftware,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async removeStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
      }

      const useCase = new RemoveStudentFromBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        studentId: req.params.studentId as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (isTrainer(req)) {
        return next(new ForbiddenError('Trainers cannot delete batches'));
      }

      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteBatch(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudentProgress(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
      }

      const useCase = new GetStudentProgress(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        studentId: req.params.studentId as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateSubjectStatus(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
      }

      const useCase = new UpdateSubjectStatus(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        studentId: req.params.studentId as string,
        subjectId: req.params.subjectId as string,
        status: req.body.status,
        progress: req.body.progress,
        notes: req.body.notes,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateBatchStatus(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      if (isTrainer(req)) {
        const batch = await assertTrainerOwnsBatch(req, next, tenantId, req.params.id as string);
        if (!batch) return;
      }

      const useCase = new UpdateBatchStatus(batchRepo);
      const result = await useCase.execute({
        tenantId,
        batchId: req.params.id as string,
        status: req.body.status,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByCompany(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListBatchesByCompany(batchRepo);
      const result = await useCase.execute({
        tenantId,
        companyId: req.params.companyId as string,
      });

      // Trainers see only their own batches within the company
      if (isTrainer(req) && req.trainerEntityId) {
        const { trainerEntityId } = req;
        result.batches = result.batches.filter((b) => b.trainer === trainerEntityId);
        result.total = result.batches.length;
      }

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listPending(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListPendingBatches(batchRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
