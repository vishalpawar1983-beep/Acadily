import { TenantSettings } from '../domain/entities/TenantSettings.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import type { ITenantSettingsRepository } from '../domain/repositories/ITenantSettingsRepository.js';
import { TenantSettingsModel, type ITenantSettingsDocument } from './TenantSettingsModel.js';

export class MongoTenantSettingsRepository implements ITenantSettingsRepository {
  async findByTenant(tenantId: string): Promise<TenantSettings | null> {
    const doc = await TenantSettingsModel.findOne({ tenantId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(settings: TenantSettings): Promise<TenantSettings> {
    const doc = await TenantSettingsModel.create({
      _id: settings.id,
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
      smtp: settings.smtp,
    });
    return this.toDomain(doc);
  }

  async update(settings: TenantSettings): Promise<TenantSettings> {
    const doc = await TenantSettingsModel.findOneAndUpdate(
      { tenantId: settings.tenantId },
      {
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
        smtp: settings.smtp,
      },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('TenantSettings', settings.tenantId);
    return this.toDomain(doc);
  }

  private toDomain(doc: ITenantSettingsDocument): TenantSettings {
    return TenantSettings.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      notifications: {
        emailEnabled: doc.notifications.emailEnabled,
        welcomeEmailEnabled: doc.notifications.welcomeEmailEnabled,
        whatsappEnabled: doc.notifications.whatsappEnabled,
        lateFeesReminderEnabled: doc.notifications.lateFeesReminderEnabled,
      },
      reminders: {
        firstReminder: doc.reminders.firstReminder,
        thirdReminder: doc.reminders.thirdReminder,
      },
      fees: {
        gstPercentage: doc.fees.gstPercentage,
        lateFeesEnabled: doc.fees.lateFeesEnabled,
      },
      emailSuggestion: {
        enabled: doc.emailSuggestion?.enabled ?? false,
        template: doc.emailSuggestion?.template ?? '',
      },
      welcomeEmail: {
        enabled: doc.welcomeEmail?.enabled ?? false,
        template: doc.welcomeEmail?.template ?? '',
      },
      whatsappMessage: {
        enabled: doc.whatsappMessage?.enabled ?? false,
        template: doc.whatsappMessage?.template ?? '',
      },
      studentGst: {
        enabled: doc.studentGst?.enabled ?? false,
        gstNumber: doc.studentGst?.gstNumber ?? '',
      },
      reminderDates: doc.reminderDates ?? [],
      emailRemainder: {
        template: doc.emailRemainder?.template ?? '',
      },
      lateFees: {
        amount: doc.lateFees?.amount ?? 0,
        frequency: doc.lateFees?.frequency ?? 'monthly',
      },
      smtp: {
        user: doc.smtp?.user ?? '',
        pass: doc.smtp?.pass ?? '',
        from: doc.smtp?.from ?? '',
      },
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
