import type { Response, NextFunction } from 'express';
import type { AppRequest } from '../../../shared/types/RequestContext.js';
import { GetSettings } from '../application/GetSettings.js';
import { UpdateSettings } from '../application/UpdateSettings.js';
import { GetSettingsSection } from '../application/GetSettingsSection.js';
import { UpdateSettingsSection } from '../application/UpdateSettingsSection.js';
import type { SettingsSectionKey } from '../application/GetSettingsSection.js';
import { MongoTenantSettingsRepository } from '../infrastructure/MongoTenantSettingsRepository.js';
import { ValidationError } from '../../../shared/domain/errors.js';

const repo = new MongoTenantSettingsRepository();

export class SettingsController {
  async get(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetSettings(repo);
      const result = await useCase.execute({ tenantId });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AppRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateSettings(repo);
      const result = await useCase.execute({
        tenantId,
        notifications: req.body.notifications,
        reminders: req.body.reminders,
        fees: req.body.fees,
        emailSuggestion: req.body.emailSuggestion,
        welcomeEmail: req.body.welcomeEmail,
        whatsappMessage: req.body.whatsappMessage,
        studentGst: req.body.studentGst,
        reminderDates: req.body.reminderDates,
        emailRemainder: req.body.emailRemainder,
        lateFees: req.body.lateFees,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getSection(req: AppRequest, res: Response, next: NextFunction, section: SettingsSectionKey): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new GetSettingsSection(repo);
      const result = await useCase.execute({ tenantId, section });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req: AppRequest, res: Response, next: NextFunction, section: SettingsSectionKey, data: unknown): Promise<void> {
    try {
      const tenantId = req.tenantContext?.tenantId;
      if (!tenantId) return next(new ValidationError('Tenant context required'));

      const useCase = new UpdateSettingsSection(repo);
      const result = await useCase.execute({ tenantId, section, data });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
