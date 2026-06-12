import { logger } from '../../logger/PinoLogger.js';
import { TenantModel } from '../../../../modules/tenant/infrastructure/TenantModel.js';
import { MongoTenantSettingsRepository } from '../../../../modules/settings/infrastructure/MongoTenantSettingsRepository.js';
import { MongoEmailTemplateRepository } from '../../../../modules/email-templates/infrastructure/MongoEmailTemplateRepository.js';
import { MongoStudentRepository } from '../../../../modules/student/infrastructure/MongoStudentRepository.js';
import { FeeInstallmentModel } from '../../../../modules/installments/infrastructure/FeeInstallmentModel.js';
import { EmailService } from '../../email/EmailService.js';

import type { EmailTemplate } from '../../../../modules/email-templates/domain/entities/EmailTemplate.js';

const CRON_EXPRESSION = '0 9 * * *'; // Daily at 9 AM
const TASK_NAME = 'fee-reminder';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

async function sendReminder(
  tenantId: string,
  installment: Record<string, unknown>,
  emailTemplate: EmailTemplate | null,
  tenantName: string,
  daysDelta: number, // positive = days before, negative = days after due
  lateFees: number,
  reminderType: 'pre-due' | 'post-due',
  studentRepo: MongoStudentRepository,
  emailService: EmailService,
  tenantLogger: { info: typeof logger.info; warn: typeof logger.warn; error: typeof logger.error; debug: typeof logger.debug },
): Promise<boolean> {
  try {
    const student = await studentRepo.findById(tenantId, installment.studentId as string);
    if (!student) {
      tenantLogger.warn({ studentId: installment.studentId }, 'Student not found for reminder');
      return false;
    }

    const studentEmail = student.contact.email;
    if (!studentEmail) return false;

    const studentName = `${student.firstName} ${student.lastName}`.trim();
    const dueDate = new Date(installment.dueDate as string).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const amount = installment.installmentAmount as number;
    const absDays = Math.abs(daysDelta);
    const remainingFees = student.enrollment.remainingFees;

    let subject: string;
    let html: string;

    if (emailTemplate && emailTemplate.isActive) {
      subject = emailTemplate.subject
        .replace(/\{\{studentName\}\}/g, studentName)
        .replace(/\{\{dueDate\}\}/g, dueDate)
        .replace(/\{\{amount\}\}/g, String(amount))
        .replace(/\{\{daysBefore\}\}/g, String(absDays))
        .replace(/\{\{installmentNumber\}\}/g, String(installment.installmentNumber))
        .replace(/\{\{LateFees\}\}/g, lateFees > 0 ? `₹${lateFees}` : 'No late fees')
        .replace(/\{\{RemainingFees\}\}/g, String(remainingFees))
        .replace(/\{\{TotalPendingAmount\}\}/g, String(remainingFees))
        .replace(/\{\{DueDateDifference\}\}/g, daysDelta < 0 ? `${absDays} days overdue` : 'On time')
        .replace(/\{\{tenantName\}\}/g, tenantName);

      html = emailTemplate.body
        .replace(/\{\{studentName\}\}/g, studentName)
        .replace(/\{\{dueDate\}\}/g, dueDate)
        .replace(/\{\{amount\}\}/g, String(amount))
        .replace(/\{\{daysBefore\}\}/g, String(absDays))
        .replace(/\{\{installmentNumber\}\}/g, String(installment.installmentNumber))
        .replace(/\{\{LateFees\}\}/g, lateFees > 0 ? `₹${lateFees}` : 'No late fees')
        .replace(/\{\{RemainingFees\}\}/g, String(remainingFees))
        .replace(/\{\{TotalPendingAmount\}\}/g, String(remainingFees))
        .replace(/\{\{DueDateDifference\}\}/g, daysDelta < 0 ? `${absDays} days overdue` : 'On time')
        .replace(/\{\{tenantName\}\}/g, tenantName);
    } else if (reminderType === 'post-due') {
      subject = `Overdue Notice: Installment #${installment.installmentNumber} - ${studentName}`;
      html = [
        `<p>Dear ${studentName},</p>`,
        `<p>This is a formal notice regarding your fees installment.</p>`,
        `<p>Your installment #${installment.installmentNumber} of <strong>₹${amount.toLocaleString('en-IN')}</strong> `,
        `was due on <strong>${dueDate}</strong> and is now <strong>${absDays} days overdue</strong>.</p>`,
        lateFees > 0 ? `<p>Late fees accumulated: <strong>₹${lateFees.toLocaleString('en-IN')}</strong></p>` : '',
        `<p>Remaining fees: ₹${remainingFees.toLocaleString('en-IN')}</p>`,
        `<p>Please make your payment at the earliest to avoid further charges.</p>`,
        `<p>Thank you,<br/>${tenantName || 'Flex Academy'}</p>`,
      ].join('');
    } else {
      subject = `Installment Payment Reminder - ${studentName}`;
      html = [
        `<p>Dear ${studentName},</p>`,
        `<p>This is a reminder that your installment #${installment.installmentNumber} `,
        `of <strong>₹${amount.toLocaleString('en-IN')}</strong> `,
        `is due on <strong>${dueDate}</strong> (${absDays} day${absDays > 1 ? 's' : ''} from now).</p>`,
        `<p>Please ensure timely payment to avoid late fees.</p>`,
        `<p>Thank you,<br/>${tenantName || 'Flex Academy'}</p>`,
      ].join('');
    }

    const sent = await emailService.send({ to: studentEmail, subject, html });
    if (sent) {
      tenantLogger.debug(
        { studentId: student.id, reminderType, daysDelta, installmentId: String(installment._id) },
        'Fee reminder sent',
      );
    }
    return sent;
  } catch (err) {
    tenantLogger.error({ err, installmentId: String(installment._id) }, 'Error sending reminder');
    return false;
  }
}

// Default pre-due reminder windows (days before due date)
const DEFAULT_PRE_DUE_DAYS = [6, 3, 1];
// Default post-due reminder windows (days after due date) — matches legacy pattern
const DEFAULT_POST_DUE_DAYS = [9, 15, 20];

async function execute(): Promise<void> {
  const taskLogger = logger.child({ task: TASK_NAME });
  taskLogger.info('Fee reminder task starting');

  const settingsRepo = new MongoTenantSettingsRepository();
  const templateRepo = new MongoEmailTemplateRepository();
  const studentRepo = new MongoStudentRepository();
  const emailService = new EmailService();

  // Get all active tenants
  const tenants = await TenantModel.find({ isActive: true }).select('tenantId name').lean().exec();
  taskLogger.info({ tenantCount: tenants.length }, 'Processing tenants for fee reminders');

  let totalReminders = 0;
  let totalSent = 0;

  for (const tenant of tenants) {
    const tenantId = tenant.tenantId;
    const tenantLogger = taskLogger.child({ tenantId });

    try {
      // Get tenant settings
      const settings = await settingsRepo.findByTenant(tenantId);
      if (!settings) {
        tenantLogger.debug('No settings found, skipping');
        continue;
      }

      // Check if late fee reminders are enabled
      if (!settings.notifications.lateFeesReminderEnabled) {
        tenantLogger.debug('Fee reminders disabled, skipping');
        continue;
      }

      // Determine reminder days from tenant settings or defaults
      const customDays = settings.reminderDates
        .map((d) => parseInt(d, 10))
        .filter((n) => !isNaN(n));
      const preDueDays = customDays.length > 0 ? customDays : DEFAULT_PRE_DUE_DAYS;

      // Try to get email templates
      const preTemplate = await templateRepo.findByName(tenantId, 'fee-reminder');
      const postTemplate = await templateRepo.findByName(tenantId, 'fee-overdue-reminder');

      // Get late fee config for overdue reminders
      const lateFeeRate = settings.lateFees.amount || 100; // default Rs.100/day (legacy)
      const lateFeeFrequency = settings.lateFees.frequency || 'daily';

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // ── PRE-DUE REMINDERS (before due date) ──
      for (const daysBefore of preDueDays) {
        const targetDate = new Date(today.getTime() + daysBefore * MS_PER_DAY);
        const nextDay = new Date(targetDate.getTime() + MS_PER_DAY);

        const upcomingInstallments = await FeeInstallmentModel.find({
          tenantId,
          dueDate: { $gte: targetDate, $lt: nextDay },
          isPaid: false,
          isDropout: false,
        }).lean().exec();

        tenantLogger.info(
          { daysBefore, targetDate: targetDate.toISOString(), count: upcomingInstallments.length },
          'Found installments for pre-due reminder',
        );

        for (const installment of upcomingInstallments) {
          totalReminders++;
          const sent = await sendReminder(
            tenantId, installment, preTemplate, tenant.name ?? '', daysBefore, 0, 'pre-due',
            studentRepo, emailService, tenantLogger,
          );
          if (sent) totalSent++;
        }
      }

      // ── POST-DUE REMINDERS (after due date — legacy pattern) ──
      for (const daysAfter of DEFAULT_POST_DUE_DAYS) {
        const targetDate = new Date(today.getTime() - daysAfter * MS_PER_DAY);
        const nextDay = new Date(targetDate.getTime() + MS_PER_DAY);

        const overdueInstallments = await FeeInstallmentModel.find({
          tenantId,
          dueDate: { $gte: targetDate, $lt: nextDay },
          isPaid: false,
          isDropout: false,
        }).lean().exec();

        tenantLogger.info(
          { daysAfter, targetDate: targetDate.toISOString(), count: overdueInstallments.length },
          'Found installments for post-due reminder',
        );

        for (const installment of overdueInstallments) {
          totalReminders++;
          // Calculate late fees: legacy uses per-day rate
          let lateFees = 0;
          if (lateFeeFrequency === 'daily') {
            lateFees = lateFeeRate * daysAfter;
          } else if (lateFeeFrequency === 'monthly') {
            lateFees = lateFeeRate * Math.ceil(daysAfter / 30);
          }

          const sent = await sendReminder(
            tenantId, installment, postTemplate ?? preTemplate, tenant.name ?? '', -daysAfter, lateFees, 'post-due',
            studentRepo, emailService, tenantLogger,
          );
          if (sent) totalSent++;
        }
      }
    } catch (err) {
      tenantLogger.error({ err }, 'Error processing fee reminders for tenant');
      // Continue with next tenant — never crash the task
    }
  }

  taskLogger.info(
    { totalReminders, totalSent },
    'Fee reminder task completed',
  );
}

export const FeeReminderTask = {
  name: TASK_NAME,
  cronExpression: CRON_EXPRESSION,
  execute,
};
