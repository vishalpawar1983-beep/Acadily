import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateRoleAccess } from '../application/CreateRoleAccess.js';
import { GetRoleAccess } from '../application/GetRoleAccess.js';
import { GetRoleAccessByRole } from '../application/GetRoleAccessByRole.js';
import { ListRoleAccess } from '../application/ListRoleAccess.js';
import { UpdateRoleAccess } from '../application/UpdateRoleAccess.js';
import { MongoRoleAccessRepository } from '../infrastructure/MongoRoleAccessRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const roleAccessRepo = new MongoRoleAccessRepository();

export class RbacController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateRoleAccess(roleAccessRepo);
      const result = await useCase.execute({
        tenantId,
        role: req.body.role,
        permissions: req.body.permissions,
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

      const useCase = new GetRoleAccess(roleAccessRepo);
      const result = await useCase.execute({
        tenantId,
        roleAccessId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getByRole(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetRoleAccessByRole(roleAccessRepo);
      const result = await useCase.execute({
        tenantId,
        role: req.params.role as string,
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

      const useCase = new ListRoleAccess(roleAccessRepo);
      const result = await useCase.execute({
        tenantId,
        skip: req.query.skip ? Number(req.query.skip) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
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

      const useCase = new UpdateRoleAccess(roleAccessRepo);
      const result = await useCase.execute({
        tenantId,
        roleAccessId: req.params.id as string,
        role: req.body.role,
        permissions: req.body.permissions,
        isActive: req.body.isActive,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
