import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { RecordCompletion } from '../application/RecordCompletion.js';
import { GetCompletion } from '../application/GetCompletion.js';
import { ListCompletions } from '../application/ListCompletions.js';
import { UpdateCompletion } from '../application/UpdateCompletion.js';
import { MongoCourseCompletionRepository } from '../infrastructure/MongoCourseCompletionRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const completionRepo = new MongoCourseCompletionRepository();

export class CompletionController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new RecordCompletion(completionRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        completionDate: req.body.completionDate,
        certificateNumber: req.body.certificateNumber,
        remarks: req.body.remarks,
        status: req.body.status,
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

      const useCase = new GetCompletion(completionRepo);
      const result = await useCase.execute({
        tenantId,
        completionId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async listByStudent(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListCompletions(completionRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
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

      const useCase = new ListCompletions(completionRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        studentId: req.query.studentId as string | undefined,
        courseId: req.query.courseId as string | undefined,
        status: req.query.status as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateCompletion(completionRepo);
      const result = await useCase.execute({
        tenantId,
        completionId: req.params.id as string,
        completionDate: req.body.completionDate,
        certificateNumber: req.body.certificateNumber,
        remarks: req.body.remarks,
        status: req.body.status,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
