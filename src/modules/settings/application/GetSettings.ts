import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ITenantSettingsRepository } from '../domain/repositories/ITenantSettingsRepository.js';
import { TenantSettings } from '../domain/entities/TenantSettings.js';
import type {
  NotificationSettings,
  ReminderTemplates,
  FeeSettings,
  EmailSuggestionSettings,
  WelcomeEmailSettings,
  WhatsappMessageSettings,
  StudentGstSettings,
  EmailRemainderSettings,
  LateFeesSettings,
} from '../domain/entities/TenantSettings.js';

export interface GetSettingsRequest {
  tenantId: string;
}

export interface GetSettingsResponse {
  tenantId: string;
  notifications: NotificationSettings;
  reminders: ReminderTemplates;
  fees: FeeSettings;
  emailSuggestion: EmailSuggestionSettings;
  welcomeEmail: WelcomeEmailSettings;
  whatsappMessage: WhatsappMessageSettings;
  studentGst: StudentGstSettings;
  reminderDates: string[];
  emailRemainder: EmailRemainderSettings;
  lateFees: LateFeesSettings;
}

export class GetSettings implements UseCase<GetSettingsRequest, GetSettingsResponse> {
  constructor(private readonly repo: ITenantSettingsRepository) {}

  async execute(request: GetSettingsRequest): Promise<GetSettingsResponse> {
    let settings = await this.repo.findByTenant(request.tenantId);

    // Auto-create defaults if no settings exist for this tenant
    if (!settings) {
      settings = TenantSettings.create({ tenantId: request.tenantId });
      settings = await this.repo.save(settings);
    }

    return {
      tenantId: settings.tenantId,
      notifications: settings.notifications,
      reminders: settings.reminders,
      fees: settings.fees,
      emailSuggestion: settings.emailSuggestion,
      welcomeEmail: settings.welcomeEmail,
      whatsappMessage: settings.whatsappMessage,
      studentGst: settings.studentGst,
      reminderDates: settings.reminderDates,
      emailRemainder: settings.emailRemainder,
      lateFees: settings.lateFees,
    };
  }
}
