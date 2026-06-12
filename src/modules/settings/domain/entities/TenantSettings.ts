import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface NotificationSettings {
  emailEnabled: boolean;
  welcomeEmailEnabled: boolean;
  whatsappEnabled: boolean;
  lateFeesReminderEnabled: boolean;
}

export interface ReminderTemplates {
  firstReminder: string;
  thirdReminder: string;
}

export interface FeeSettings {
  gstPercentage: number;
  lateFeesEnabled: boolean;
}

export interface EmailSuggestionSettings {
  enabled: boolean;
  template: string;
}

export interface WelcomeEmailSettings {
  enabled: boolean;
  template: string;
}

export interface WhatsappMessageSettings {
  enabled: boolean;
  template: string;
}

export interface StudentGstSettings {
  enabled: boolean;
  gstNumber: string;
}

export interface EmailRemainderSettings {
  template: string;
}

export interface LateFeesSettings {
  amount: number;
  frequency: string;
}

export interface SmtpSettings {
  user: string;
  pass: string;
  from: string;
}

interface TenantSettingsProps {
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
  smtp: SmtpSettings;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantSettings extends AggregateRoot<TenantSettingsProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get notifications(): NotificationSettings {
    return { ...this.props.notifications };
  }
  get reminders(): ReminderTemplates {
    return { ...this.props.reminders };
  }
  get fees(): FeeSettings {
    return { ...this.props.fees };
  }
  get emailSuggestion(): EmailSuggestionSettings {
    return { ...this.props.emailSuggestion };
  }
  get welcomeEmail(): WelcomeEmailSettings {
    return { ...this.props.welcomeEmail };
  }
  get whatsappMessage(): WhatsappMessageSettings {
    return { ...this.props.whatsappMessage };
  }
  get studentGst(): StudentGstSettings {
    return { ...this.props.studentGst };
  }
  get reminderDates(): string[] {
    return [...this.props.reminderDates];
  }
  get emailRemainder(): EmailRemainderSettings {
    return { ...this.props.emailRemainder };
  }
  get lateFees(): LateFeesSettings {
    return { ...this.props.lateFees };
  }
  get smtp(): SmtpSettings {
    return { ...this.props.smtp };
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateNotifications(input: Partial<NotificationSettings>): void {
    if (input.emailEnabled !== undefined) this.props.notifications.emailEnabled = input.emailEnabled;
    if (input.welcomeEmailEnabled !== undefined) this.props.notifications.welcomeEmailEnabled = input.welcomeEmailEnabled;
    if (input.whatsappEnabled !== undefined) this.props.notifications.whatsappEnabled = input.whatsappEnabled;
    if (input.lateFeesReminderEnabled !== undefined) this.props.notifications.lateFeesReminderEnabled = input.lateFeesReminderEnabled;
    this.props.updatedAt = new Date();
  }

  updateReminders(input: Partial<ReminderTemplates>): void {
    if (input.firstReminder !== undefined) this.props.reminders.firstReminder = input.firstReminder;
    if (input.thirdReminder !== undefined) this.props.reminders.thirdReminder = input.thirdReminder;
    this.props.updatedAt = new Date();
  }

  updateFees(input: Partial<FeeSettings>): void {
    if (input.gstPercentage !== undefined) this.props.fees.gstPercentage = input.gstPercentage;
    if (input.lateFeesEnabled !== undefined) this.props.fees.lateFeesEnabled = input.lateFeesEnabled;
    this.props.updatedAt = new Date();
  }

  updateEmailSuggestion(input: Partial<EmailSuggestionSettings>): void {
    if (input.enabled !== undefined) this.props.emailSuggestion.enabled = input.enabled;
    if (input.template !== undefined) this.props.emailSuggestion.template = input.template;
    this.props.updatedAt = new Date();
  }

  updateWelcomeEmail(input: Partial<WelcomeEmailSettings>): void {
    if (input.enabled !== undefined) this.props.welcomeEmail.enabled = input.enabled;
    if (input.template !== undefined) this.props.welcomeEmail.template = input.template;
    this.props.updatedAt = new Date();
  }

  updateWhatsappMessage(input: Partial<WhatsappMessageSettings>): void {
    if (input.enabled !== undefined) this.props.whatsappMessage.enabled = input.enabled;
    if (input.template !== undefined) this.props.whatsappMessage.template = input.template;
    this.props.updatedAt = new Date();
  }

  updateStudentGst(input: Partial<StudentGstSettings>): void {
    if (input.enabled !== undefined) this.props.studentGst.enabled = input.enabled;
    if (input.gstNumber !== undefined) this.props.studentGst.gstNumber = input.gstNumber;
    this.props.updatedAt = new Date();
  }

  updateReminderDates(dates: string[]): void {
    this.props.reminderDates = [...dates];
    this.props.updatedAt = new Date();
  }

  updateEmailRemainder(input: Partial<EmailRemainderSettings>): void {
    if (input.template !== undefined) this.props.emailRemainder.template = input.template;
    this.props.updatedAt = new Date();
  }

  updateLateFees(input: Partial<LateFeesSettings>): void {
    if (input.amount !== undefined) this.props.lateFees.amount = input.amount;
    if (input.frequency !== undefined) this.props.lateFees.frequency = input.frequency;
    this.props.updatedAt = new Date();
  }

  updateSmtp(input: Partial<SmtpSettings>): void {
    if (input.user !== undefined) this.props.smtp.user = input.user;
    if (input.pass !== undefined) this.props.smtp.pass = input.pass;
    if (input.from !== undefined) this.props.smtp.from = input.from;
    this.props.updatedAt = new Date();
  }

  static create(input: { tenantId: string } & Partial<{
    notifications: Partial<NotificationSettings>;
    reminders: Partial<ReminderTemplates>;
    fees: Partial<FeeSettings>;
    emailSuggestion: Partial<EmailSuggestionSettings>;
    welcomeEmail: Partial<WelcomeEmailSettings>;
    whatsappMessage: Partial<WhatsappMessageSettings>;
    studentGst: Partial<StudentGstSettings>;
    reminderDates: string[];
    emailRemainder: Partial<EmailRemainderSettings>;
    lateFees: Partial<LateFeesSettings>;
    smtp: Partial<SmtpSettings>;
  }>, id?: string): TenantSettings {
    return new TenantSettings(
      {
        tenantId: input.tenantId,
        notifications: {
          emailEnabled: input.notifications?.emailEnabled ?? true,
          welcomeEmailEnabled: input.notifications?.welcomeEmailEnabled ?? true,
          whatsappEnabled: input.notifications?.whatsappEnabled ?? false,
          lateFeesReminderEnabled: input.notifications?.lateFeesReminderEnabled ?? true,
        },
        reminders: {
          firstReminder: input.reminders?.firstReminder ?? '',
          thirdReminder: input.reminders?.thirdReminder ?? '',
        },
        fees: {
          gstPercentage: input.fees?.gstPercentage ?? 18,
          lateFeesEnabled: input.fees?.lateFeesEnabled ?? false,
        },
        emailSuggestion: {
          enabled: input.emailSuggestion?.enabled ?? false,
          template: input.emailSuggestion?.template ?? '',
        },
        welcomeEmail: {
          enabled: input.welcomeEmail?.enabled ?? false,
          template: input.welcomeEmail?.template ?? '',
        },
        whatsappMessage: {
          enabled: input.whatsappMessage?.enabled ?? false,
          template: input.whatsappMessage?.template ?? '',
        },
        studentGst: {
          enabled: input.studentGst?.enabled ?? false,
          gstNumber: input.studentGst?.gstNumber ?? '',
        },
        reminderDates: input.reminderDates ?? [],
        emailRemainder: {
          template: input.emailRemainder?.template ?? '',
        },
        lateFees: {
          amount: input.lateFees?.amount ?? 0,
          frequency: input.lateFees?.frequency ?? 'monthly',
        },
        smtp: {
          user: input.smtp?.user ?? '',
          pass: input.smtp?.pass ?? '',
          from: input.smtp?.from ?? '',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(id: string, props: TenantSettingsProps): TenantSettings {
    return new TenantSettings(props, id);
  }
}
