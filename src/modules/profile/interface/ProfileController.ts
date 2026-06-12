import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { GetProfile } from '../application/GetProfile.js';
import { CreateOrUpdateProfile } from '../application/CreateOrUpdateProfile.js';
import { MongoProfileRepository } from '../infrastructure/MongoProfileRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoProfileRepository();

export class ProfileController {
  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const userId = req.user?.userId;
      if (!userId) return next(new ValidationError('User authentication required'));

      const useCase = new GetProfile(repo);
      const result = await useCase.execute({ tenantId, userId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async upsert(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const userId = req.user?.userId;
      if (!userId) return next(new ValidationError('User authentication required'));

      const useCase = new CreateOrUpdateProfile(repo);
      const result = await useCase.execute({
        tenantId,
        userId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        company: req.body.company,
        contactPhone: req.body.contactPhone,
        companySite: req.body.companySite,
        country: req.body.country,
        language: req.body.language,
        timeZone: req.body.timeZone,
        currency: req.body.currency,
        communications: req.body.communications,
        allowMarketing: req.body.allowMarketing,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
