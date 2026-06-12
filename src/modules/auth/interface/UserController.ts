import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateUser } from '../application/CreateUser.js';
import { ListUsers } from '../application/ListUsers.js';
import { GetUser } from '../application/GetUser.js';
import { UpdateUser } from '../application/UpdateUser.js';
import { DeleteUser } from '../application/DeleteUser.js';
import { RequestPasswordReset } from '../application/RequestPasswordReset.js';
import { ResetPassword } from '../application/ResetPassword.js';
import { MongoUserRepository } from '../infrastructure/MongoUserRepository.js';
import { PasswordService } from '../infrastructure/PasswordService.js';
import { ValidationError } from '../../../shared/infrastructure/middleware/errorHandler.js';
import type { RoleType } from '../domain/value-objects/Role.js';

const userRepo = new MongoUserRepository();
const passwordService = new PasswordService();

export class UserController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const role = req.user?.role as RoleType;
      if (!tenantId || !role) return next(new ValidationError('Auth context required'));

      const useCase = new CreateUser(userRepo, passwordService);
      const result = await useCase.execute({
        tenantId,
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        role: req.body.role,
        requestingUserRole: role,
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

      const useCase = new ListUsers(userRepo);
      const result = await useCase.execute({
        tenantId,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        search: req.query.search as string | undefined,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetUser(userRepo);
      const result = await useCase.execute({
        tenantId,
        userId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const role = req.user?.role as RoleType;
      if (!tenantId || !role) return next(new ValidationError('Auth context required'));

      const useCase = new UpdateUser(userRepo, passwordService);
      const result = await useCase.execute({
        tenantId,
        userId: req.params.id as string,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        role: req.body.role,
        password: req.body.password,
        requestingUserRole: role,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new DeleteUser(userRepo);
      const result = await useCase.execute({
        tenantId,
        userId: req.params.id as string,
        requestingUserId: userId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async requestPasswordReset(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const useCase = new RequestPasswordReset(userRepo);
      const result = await useCase.execute({
        tenantId: tenantId && tenantId !== '__unauthenticated__' ? tenantId : undefined,
        email: req.body.email,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ResetPassword(userRepo, passwordService);
      const result = await useCase.execute({
        token: req.body.token,
        newPassword: req.body.newPassword,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
