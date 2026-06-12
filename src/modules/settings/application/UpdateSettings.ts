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

export interface UpdateSettingsRequest {
  tenantId: string;
  notifications?: Partial<NotificationSettings>;
  reminders?: Partial<ReminderTemplates>;
  fees?: Partial<FeeSettings>;
  emailSuggestion?: Partial<EmailSuggestionSettings>;
  welcomeEmail?: Partial<WelcomeEmailSettings>;
  whatsappMessage?: Partial<WhatsappMessageSettings>;
  studentGst?: Partial<StudentGstSettings>;
  reminderDates?: string[];
  emailRemainder?: Partial<EmailRemainderSettings>;
  lateFees?: Partial<LateFeesSettings>;
}

export interface UpdateSettingsResponse {
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

export class UpdateSettings implements UseCase<UpdateSettingsRequest, UpdateSettingsResponse> {
  constructor(private readonly repo: ITenantSettingsRepository) {}

  async execute(request: UpdateSettingsRequest): Promise<UpdateSettingsResponse> {
    let settings = await this.repo.findByTenant(request.tenantId);

    if (!settings) {
      // Auto-create with provided values
      settings = TenantSettings.create({
        tenantId: request.tenantId,
        notifications: request.notifications,
        reminders: request.reminders,
        fees: request.fees,
        emailSuggestion: request.emailSuggestion,
        welcomeEmail: request.welcomeEmail,
        whatsappMessage: request.whatsappMessage,
        studentGst: request.studentGst,
        reminderDates: request.reminderDates,
        emailRemainder: request.emailRemainder,
        lateFees: request.lateFees,
      });
      settings = await this.repo.save(settings);
    } else {
      if (request.notifications) settings.updateNotifications(request.notifications);
      if (request.reminders) settings.updateReminders(request.reminders);
      if (request.fees) settings.updateFees(request.fees);
      if (request.emailSuggestion) settings.updateEmailSuggestion(request.emailSuggestion);
      if (request.welcomeEmail) settings.updateWelcomeEmail(request.welcomeEmail);
      if (request.whatsappMessage) settings.updateWhatsappMessage(request.whatsappMessage);
      if (request.studentGst) settings.updateStudentGst(request.studentGst);
      if (request.reminderDates) settings.updateReminderDates(request.reminderDates);
      if (request.emailRemainder) settings.updateEmailRemainder(request.emailRemainder);
      if (request.lateFees) settings.updateLateFees(request.lateFees);
      settings = await this.repo.update(settings);
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
