import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantSettingsRepository } from '../domain/repositories/ITenantSettingsRepository.js';
import { TenantSettings } from '../domain/entities/TenantSettings.js';

export type SettingsSectionKey =
  | 'emailSuggestion'
  | 'welcomeEmail'
  | 'whatsappMessage'
  | 'studentGst'
  | 'reminderDates'
  | 'emailRemainder'
  | 'lateFees'
  | 'smtp';

export interface GetSettingsSectionRequest {
  tenantId: string;
  section: SettingsSectionKey;
}

export class GetSettingsSection implements UseCase<GetSettingsSectionRequest, unknown> {
  constructor(private readonly repo: ITenantSettingsRepository) {}

  async execute(request: GetSettingsSectionRequest): Promise<unknown> {
    let settings = await this.repo.findByTenant(request.tenantId);

    if (!settings) {
      settings = TenantSettings.create({ tenantId: request.tenantId });
      settings = await this.repo.save(settings);
    }

    return settings[request.section];
  }
}
