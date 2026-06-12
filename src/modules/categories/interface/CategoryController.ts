import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateCategory } from '../application/CreateCategory.js';
import { GetCategory } from '../application/GetCategory.js';
import { ListCategories } from '../application/ListCategories.js';
import { UpdateCategory } from '../application/UpdateCategory.js';
import { DeleteCategory } from '../application/DeleteCategory.js';
import { MongoCategoryRepository } from '../infrastructure/MongoCategoryRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const categoryRepo = new MongoCategoryRepository();

export class CategoryController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      const userId = req.user?.userId;
      if (!tenantId || !userId) return next(new ValidationError('Auth context required'));

      const useCase = new CreateCategory(categoryRepo);
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

      const useCase = new GetCategory(categoryRepo);
      const result = await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
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

      const useCase = new ListCategories(categoryRepo);
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

      const useCase = new UpdateCategory(categoryRepo);
      const result = await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
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

      const useCase = new DeleteCategory(categoryRepo);
      const result = await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
