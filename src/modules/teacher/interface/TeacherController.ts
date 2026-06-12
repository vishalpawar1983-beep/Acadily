import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateTeacher } from '../application/CreateTeacher.js';
import { GetTeacher } from '../application/GetTeacher.js';
import { ListTeachers } from '../application/ListTeachers.js';
import { UpdateTeacher } from '../application/UpdateTeacher.js';
import { DeleteTeacher } from '../application/DeleteTeacher.js';
import { MongoTeacherRepository } from '../infrastructure/MongoTeacherRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const teacherRepo = new MongoTeacherRepository();

export class TeacherController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateTeacher(teacherRepo);
      const result = await useCase.execute({
        tenantId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        subjects: req.body.subjects,
        qualification: req.body.qualification,
        experience: req.body.experience,
        address: req.body.address,
        joiningDate: req.body.joiningDate,
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

      const useCase = new GetTeacher(teacherRepo);
      const result = await useCase.execute({
        tenantId,
        teacherId: req.params.id as string,
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

      const useCase = new ListTeachers(teacherRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string | undefined,
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

      const useCase = new UpdateTeacher(teacherRepo);
      const result = await useCase.execute({
        tenantId,
        teacherId: req.params.id as string,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        subjects: req.body.subjects,
        qualification: req.body.qualification,
        experience: req.body.experience,
        address: req.body.address,
        isActive: req.body.isActive,
        joiningDate: req.body.joiningDate,
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

      const useCase = new DeleteTeacher(teacherRepo);
      const result = await useCase.execute({
        tenantId,
        teacherId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
