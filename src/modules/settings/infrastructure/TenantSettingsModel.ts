import mongoose, { Schema, type Document } from 'mongoose';

export interface ITenantSettingsDocument extends Document {
  tenantId: string;
  notifications: {
    emailEnabled: boolean;
    welcomeEmailEnabled: boolean;
    whatsappEnabled: boolean;
    lateFeesReminderEnabled: boolean;
  };
  reminders: {
    firstReminder: string;
    thirdReminder: string;
  };
  fees: {
    gstPercentage: number;
    lateFeesEnabled: boolean;
  };
  emailSuggestion: {
    enabled: boolean;
    template: string;
  };
  welcomeEmail: {
    enabled: boolean;
    template: string;
  };
  whatsappMessage: {
    enabled: boolean;
    template: string;
  };
  studentGst: {
    enabled: boolean;
    gstNumber: string;
  };
  reminderDates: string[];
  emailRemainder: {
    template: string;
  };
  lateFees: {
    amount: number;
    frequency: string;
  };
  smtp: {
    user: string;
    pass: string;
    from: string;
  };
  otpEnabled: boolean;
  autoLogout: {
    enabled: boolean;
    timeoutMinutes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSettingsSchema = new Schema<ITenantSettingsDocument>(
  {
    tenantId: { type: String, required: true, unique: true },
    notifications: {
      emailEnabled: { type: Boolean, default: true },
      welcomeEmailEnabled: { type: Boolean, default: true },
      whatsappEnabled: { type: Boolean, default: false },
      lateFeesReminderEnabled: { type: Boolean, default: true },
    },
    reminders: {
      firstReminder: { type: String, default: '' },
      thirdReminder: { type: String, default: '' },
    },
    fees: {
      gstPercentage: { type: Number, default: 18 },
      lateFeesEnabled: { type: Boolean, default: false },
    },
    emailSuggestion: {
      enabled: { type: Boolean, default: false },
      template: { type: String, default: '' },
    },
    welcomeEmail: {
      enabled: { type: Boolean, default: false },
      template: { type: String, default: '' },
    },
    whatsappMessage: {
      enabled: { type: Boolean, default: false },
      template: { type: String, default: '' },
    },
    studentGst: {
      enabled: { type: Boolean, default: false },
      gstNumber: { type: String, default: '' },
    },
    reminderDates: { type: [String], default: [] },
    emailRemainder: {
      template: { type: String, default: '' },
    },
    lateFees: {
      amount: { type: Number, default: 0 },
      frequency: { type: String, default: 'monthly' },
    },
    smtp: {
      user: { type: String, default: '' },
      pass: { type: String, default: '' },
      from: { type: String, default: '' },
    },
    otpEnabled: { type: Boolean, default: true },
    autoLogout: {
      enabled: { type: Boolean, default: false },
      timeoutMinutes: { type: Number, default: 30 },
    },
  },
  { timestamps: true },
);

export const TenantSettingsModel = mongoose.model<ITenantSettingsDocument>(
  'TenantSettings',
  tenantSettingsSchema,
);
