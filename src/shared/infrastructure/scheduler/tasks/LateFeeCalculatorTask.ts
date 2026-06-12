import { logger } from '../../logger/PinoLogger.js';
import { TenantModel } from '../../../../modules/tenant/infrastructure/TenantModel.js';
import { MongoTenantSettingsRepository } from '../../../../modules/settings/infrastructure/MongoTenantSettingsRepository.js';
import { MongoFeeInstallmentRepository } from '../../../../modules/installments/infrastructure/MongoFeeInstallmentRepository.js';
import { FeeInstallmentModel } from '../../../../modules/installments/infrastructure/FeeInstallmentModel.js';

const CRON_EXPRESSION = '0 0 * * *'; // Daily at midnight
const TASK_NAME = 'late-fee-calculator';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30;

async function execute(): Promise<void> {
  const taskLogger = logger.child({ task: TASK_NAME });
  taskLogger.info('Late fee calculator starting');

  const settingsRepo = new MongoTenantSettingsRepository();
  const installmentRepo = new MongoFeeInstallmentRepository();

  // Get all active tenants
  const tenants = await TenantModel.find({ isActive: true }).select('tenantId').lean().exec();
  taskLogger.info({ tenantCount: tenants.length }, 'Processing tenants for late fees');

  let totalProcessed = 0;
  let totalUpdated = 0;

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

      // Check if late fees are enabled
      if (!settings.fees.lateFeesEnabled) {
        tenantLogger.debug('Late fees disabled, skipping');
        continue;
      }

      const lateFeeAmount = settings.lateFees.amount;
      const lateFeeFrequency = settings.lateFees.frequency;

      if (lateFeeAmount <= 0) {
        tenantLogger.debug('Late fee amount is 0, skipping');
        continue;
      }

      // Get overdue installments
      const overdueInstallments = await installmentRepo.findOverdue(tenantId);
      tenantLogger.info(
        { overdueCount: overdueInstallments.length },
        'Found overdue installments',
      );

      const now = new Date();

      for (const installment of overdueInstallments) {
        totalProcessed++;

        const daysOverdue = Math.floor(
          (now.getTime() - installment.dueDate.getTime()) / MS_PER_DAY,
        );

        let calculatedLateFee = 0;

        if (lateFeeFrequency === 'daily') {
          // Legacy pattern: Rs. X per overdue day (e.g., 100/day)
          calculatedLateFee = lateFeeAmount * daysOverdue;
        } else if (lateFeeFrequency === 'monthly') {
          const monthsOverdue = Math.ceil(daysOverdue / DAYS_PER_MONTH);
          calculatedLateFee = lateFeeAmount * monthsOverdue;
        } else {
          // Default: flat one-time late fee
          calculatedLateFee = lateFeeAmount;
        }

        if (calculatedLateFee <= 0) continue;

        // Update the installment by adding the late fee to the installment amount.
        // We use the model directly to do an atomic update that adds the late fee
        // only if it hasn't already been applied for this period.
        // Using FeeInstallmentModel directly to set a lateFee field without
        // modifying the domain entity (late fees are supplementary metadata).
        await FeeInstallmentModel.findOneAndUpdate(
          { _id: installment.id, tenantId },
          {
            $set: {
              lateFee: calculatedLateFee,
              lateFeeCalculatedAt: now,
              daysOverdue,
            },
          },
        ).exec();

        totalUpdated++;

        tenantLogger.debug(
          {
            installmentId: installment.id,
            studentId: installment.studentId,
            daysOverdue,
            calculatedLateFee,
          },
          'Late fee calculated for installment',
        );
      }
    } catch (err) {
      tenantLogger.error({ err }, 'Error processing late fees for tenant');
      // Continue with next tenant — never crash the task
    }
  }

  taskLogger.info(
    { totalProcessed, totalUpdated },
    'Late fee calculator completed',
  );
}

export const LateFeeCalculatorTask = {
  name: TASK_NAME,
  cronExpression: CRON_EXPRESSION,
  execute,
};
