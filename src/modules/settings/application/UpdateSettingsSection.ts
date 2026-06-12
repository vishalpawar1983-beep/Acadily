import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantSettingsRepository } from '../domain/repositories/ITenantSettingsRepository.js';
import { TenantSettings } from '../domain/entities/TenantSettings.js';
import type { SettingsSectionKey } from './GetSettingsSection.js';

export interface UpdateSettingsSectionRequest {
  tenantId: string;
  section: SettingsSectionKey;
  data: unknown;
}

const updateMap: Record<SettingsSectionKey, string> = {
  emailSuggestion: 'updateEmailSuggestion',
  welcomeEmail: 'updateWelcomeEmail',
  whatsappMessage: 'updateWhatsappMessage',
  studentGst: 'updateStudentGst',
  reminderDates: 'updateReminderDates',
  emailRemainder: 'updateEmailRemainder',
  lateFees: 'updateLateFees',
  smtp: 'updateSmtp',
};

export class UpdateSettingsSection implements UseCase<UpdateSettingsSectionRequest, unknown> {
  constructor(private readonly repo: ITenantSettingsRepository) {}

  async execute(request: UpdateSettingsSectionRequest): Promise<unknown> {
    let settings = await this.repo.findByTenant(request.tenantId);

    if (!settings) {
      settings = TenantSettings.create({ tenantId: request.tenantId });
      settings = await this.repo.save(settings);
    }

    const method = updateMap[request.section] as keyof TenantSettings;
    (settings as any)[method](request.data);
    settings = await this.repo.update(settings);

    return settings[request.section];
  }
}
