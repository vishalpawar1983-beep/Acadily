import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { RecordMarks } from '../application/RecordMarks.js';
import { GetStudentMarks } from '../application/GetStudentMarks.js';
import { ListMarks } from '../application/ListMarks.js';
import { UpdateMarks } from '../application/UpdateMarks.js';
import { AssignSubjectsToStudent } from '../application/AssignSubjectsToStudent.js';
import { BulkUpdateMarks } from '../application/BulkUpdateMarks.js';
import { GetStudentCourseMarks } from '../application/GetStudentCourseMarks.js';
import { MongoStudentMarksRepository } from '../infrastructure/MongoStudentMarksRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const marksRepo = new MongoStudentMarksRepository();

export class MarksController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new RecordMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        subjects: req.body.subjects,
        resultStatus: req.body.resultStatus,
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

      const useCase = new GetStudentMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        marksId: req.params.id as string,
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

      const useCase = new ListMarks(marksRepo);
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

      const useCase = new ListMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        studentId: req.query.studentId as string | undefined,
        courseId: req.query.courseId as string | undefined,
        resultStatus: req.query.resultStatus as string | undefined,
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

      const useCase = new UpdateMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        marksId: req.params.id as string,
        subjects: req.body.subjects,
        resultStatus: req.body.resultStatus,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async assignSubjects(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new AssignSubjectsToStudent(marksRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        subjectIds: req.body.subjectIds,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async bulkUpdate(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new BulkUpdateMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.body.studentId,
        courseId: req.body.courseId,
        subjects: req.body.subjects,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudentCourseMarks(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetStudentCourseMarks(marksRepo);
      const result = await useCase.execute({
        tenantId,
        studentId: req.params.studentId as string,
        courseId: req.params.courseId as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
