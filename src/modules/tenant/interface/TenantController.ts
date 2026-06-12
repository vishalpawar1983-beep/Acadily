import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { CreateTenant } from '../application/CreateTenant.js';
import { GetTenant } from '../application/GetTenant.js';
import { ListTenants } from '../application/ListTenants.js';
import { UpdateTenant } from '../application/UpdateTenant.js';
import { DeleteTenant } from '../application/DeleteTenant.js';
import { MongoTenantRepository } from '../infrastructure/MongoTenantRepository.js';

const tenantRepo = new MongoTenantRepository();

export class TenantController {
  async create(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new CreateTenant(tenantRepo);
      const result = await useCase.execute({
        tenantId: req.body.tenantId,
        name: req.body.name,
        slug: req.body.slug,
        email: req.body.email,
        phone: req.body.phone,
        website: req.body.website,
        address: req.body.address,
        logo: req.body.logo,
        config: req.body.config,
        plan: req.body.plan,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const identifier = req.params.identifier as string;
      const useCase = new GetTenant(tenantRepo);

      // Try as slug first; if it looks like a MongoDB ObjectId, treat as id
      const isObjectId = /^[a-f0-9]{24}$/.test(identifier);
      const result = await useCase.execute(
        isObjectId ? { id: identifier } : { slug: identifier },
      );

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async list(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new ListTenants(tenantRepo);
      const result = await useCase.execute({
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
      const useCase = new UpdateTenant(tenantRepo);
      const result = await useCase.execute({
        id: req.params.id as string,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        website: req.body.website,
        address: req.body.address,
        logo: req.body.logo,
        config: req.body.config,
        plan: req.body.plan,
        isActive: req.body.isActive,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const useCase = new DeleteTenant(tenantRepo);
      const result = await useCase.execute({
        id: req.params.id as string,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
