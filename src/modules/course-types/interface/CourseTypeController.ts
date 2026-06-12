import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateCourseType } from '../application/CreateCourseType.js';
import { GetCourseType } from '../application/GetCourseType.js';
import { ListCourseTypes } from '../application/ListCourseTypes.js';
import { UpdateCourseType } from '../application/UpdateCourseType.js';
import { DeleteCourseType } from '../application/DeleteCourseType.js';
import { MongoCourseTypeRepository } from '../infrastructure/MongoCourseTypeRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const courseTypeRepo = new MongoCourseTypeRepository();

export class CourseTypeController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new CreateCourseType(courseTypeRepo);
      const result = await useCase.execute({
        tenantId,
        name: req.body.name,
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

      const useCase = new GetCourseType(courseTypeRepo);
      const result = await useCase.execute({
        tenantId,
        courseTypeId: req.params.id as string,
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

      const useCase = new ListCourseTypes(courseTypeRepo);
      const result = await useCase.execute({
        tenantId,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
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

      const useCase = new UpdateCourseType(courseTypeRepo);
      const result = await useCase.execute({
        tenantId,
        courseTypeId: req.params.id as string,
        name: req.body.name,
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

      const useCase = new DeleteCourseType(courseTypeRepo);
      const result = await useCase.execute({
        tenantId,
        courseTypeId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
