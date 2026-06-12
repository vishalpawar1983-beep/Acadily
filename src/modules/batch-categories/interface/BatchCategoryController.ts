import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateBatchCategory } from '../application/CreateBatchCategory.js';
import { ListBatchCategories } from '../application/ListBatchCategories.js';
import { GetBatchCategory } from '../application/GetBatchCategory.js';
import { UpdateBatchCategory } from '../application/UpdateBatchCategory.js';
import { DeleteBatchCategory } from '../application/DeleteBatchCategory.js';
import { MongoBatchCategoryRepository } from '../infrastructure/MongoBatchCategoryRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoBatchCategoryRepository();

export class BatchCategoryController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new CreateBatchCategory(repo);
      const result = await useCase.execute({
        tenantId,
        categoryName: req.body.categoryName,
        createdBy: req.user?.userId ?? '',
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

      const useCase = new ListBatchCategories(repo);
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

  async getById(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetBatchCategory(repo);
      const result = await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
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

      const useCase = new UpdateBatchCategory(repo);
      const result = await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
        categoryName: req.body.categoryName,
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

      const useCase = new DeleteBatchCategory(repo);
      await useCase.execute({
        tenantId,
        categoryId: req.params.id as string,
      });
      res.json({ success: true, message: 'Batch category deleted' });
    } catch (err) {
      next(err);
    }
  }
}
