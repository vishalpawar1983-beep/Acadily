import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    notifications: z.object({
      emailEnabled: z.boolean().optional(),
      welcomeEmailEnabled: z.boolean().optional(),
      whatsappEnabled: z.boolean().optional(),
      lateFeesReminderEnabled: z.boolean().optional(),
    }).optional(),
    reminders: z.object({
      firstReminder: z.string().optional(),
      thirdReminder: z.string().optional(),
    }).optional(),
    fees: z.object({
      gstPercentage: z.number().min(0).max(100).optional(),
      lateFeesEnabled: z.boolean().optional(),
    }).optional(),
    emailSuggestion: z.object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
    }).optional(),
    welcomeEmail: z.object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
    }).optional(),
    whatsappMessage: z.object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
    }).optional(),
    studentGst: z.object({
      enabled: z.boolean().optional(),
      gstNumber: z.string().optional(),
    }).optional(),
    reminderDates: z.array(z.string()).optional(),
    emailRemainder: z.object({
      template: z.string().optional(),
    }).optional(),
    lateFees: z.object({
      amount: z.number().min(0).optional(),
      frequency: z.string().optional(),
    }).optional(),
  }),
});

// Sub-route schemas
export const updateEmailSuggestionSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    template: z.string().optional(),
  }),
});

export const updateWelcomeEmailSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    template: z.string().optional(),
  }),
});

export const updateWhatsappMessageSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    template: z.string().optional(),
  }),
});

export const updateStudentGstSchema = z.object({
  body: z.object({
    enabled: z.boolean().optional(),
    gstNumber: z.string().optional(),
  }),
});

export const updateReminderDatesSchema = z.object({
  body: z.object({
    reminderDates: z.array(z.string()),
  }),
});

export const updateEmailRemainderSchema = z.object({
  body: z.object({
    template: z.string().optional(),
  }),
});

export const updateLateFeesSchema = z.object({
  body: z.object({
    amount: z.number().min(0).optional(),
    frequency: z.string().optional(),
  }),
});

export const updateSmtpSchema = z.object({
  body: z.object({
    user: z.string().email().optional(),
    pass: z.string().min(1).optional(),
    from: z.string().optional(),
  }),
});
