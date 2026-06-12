import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateSubject } from '../application/CreateSubject.js';
import { ListSubjects } from '../application/ListSubjects.js';
import { GetSubject } from '../application/GetSubject.js';
import { UpdateSubject } from '../application/UpdateSubject.js';
import { DeleteSubject } from '../application/DeleteSubject.js';
import { MongoSubjectRepository } from '../infrastructure/MongoSubjectRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const subjectRepo = new MongoSubjectRepository();

export class SubjectController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const userId = req.user?.userId;
      if (!userId) return next(new ValidationError('User context required'));

      const useCase = new CreateSubject(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        subjectName: req.body.subjectName,
        subjectCode: req.body.subjectCode,
        fullMarks: req.body.fullMarks,
        passMarks: req.body.passMarks,
        semYear: req.body.semYear,
        courseId: req.body.courseId || '',
        addedBy: userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListSubjects(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        courseId: req.query.courseId as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetSubject(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        subjectId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByCourse(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new ListSubjects(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        courseId: req.params.courseId as string,
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

      const useCase = new UpdateSubject(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        subjectId: req.params.id as string,
        subjectName: req.body.subjectName,
        subjectCode: req.body.subjectCode,
        fullMarks: req.body.fullMarks,
        passMarks: req.body.passMarks,
        semYear: req.body.semYear,
        courseId: req.body.courseId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new DeleteSubject(subjectRepo);
      const result = await useCase.execute({
        tenantId,
        subjectId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
