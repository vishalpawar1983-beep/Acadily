import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateCourse } from '../application/CreateCourse.js';
import { GetCourse } from '../application/GetCourse.js';
import { ListCourses } from '../application/ListCourses.js';
import { UpdateCourse } from '../application/UpdateCourse.js';
import { DeleteCourse } from '../application/DeleteCourse.js';
import { MongoCourseRepository } from '../infrastructure/MongoCourseRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const courseRepo = new MongoCourseRepository();

export class CourseController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new CreateCourse(courseRepo);
      const result = await useCase.execute({
        tenantId,
        name: req.body.name,
        fees: req.body.fees,
        courseType: req.body.courseType,
        durationYears: req.body.durationYears,
        category: req.body.category,
        subjects: req.body.subjects,
        createdBy: userId,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetCourse(courseRepo);
      const result = await useCase.execute({
        tenantId,
        courseId: req.params.id as string,
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

      const useCase = new ListCourses(courseRepo);
      const result = await useCase.execute({
        tenantId,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        category: req.query.category as string | undefined,
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

      const useCase = new UpdateCourse(courseRepo);
      const result = await useCase.execute({
        tenantId,
        courseId: req.params.id as string,
        name: req.body.name,
        fees: req.body.fees,
        courseType: req.body.courseType,
        durationYears: req.body.durationYears,
        category: req.body.category,
        subjects: req.body.subjects,
        isActive: req.body.isActive,
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

      const useCase = new DeleteCourse(courseRepo);
      const result = await useCase.execute({
        tenantId,
        courseId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
