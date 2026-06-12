import { logger } from '../../logger/PinoLogger.js';
import { TenantModel } from '../../../../modules/tenant/infrastructure/TenantModel.js';
import { PaymentTransactionModel } from '../../../../modules/payment-gateway/infrastructure/PaymentTransactionModel.js';

const CRON_EXPRESSION = '30 0 * * *'; // Daily at 00:30 UTC = 6:00 AM IST
const TASK_NAME = 'payment-reconciliation';

const MS_PER_HOUR = 1000 * 60 * 60;
const STALE_THRESHOLD_HOURS = 24;

async function execute(): Promise<void> {
  const taskLogger = logger.child({ task: TASK_NAME });
  taskLogger.info('Payment reconciliation task starting');

  // Get all active tenants
  const tenants = await TenantModel.find({ isActive: true }).select('tenantId name').lean().exec();
  taskLogger.info({ tenantCount: tenants.length }, 'Processing tenants for payment reconciliation');

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_HOURS * MS_PER_HOUR);
  let totalStale = 0;
  const staleByTenant: Record<string, number> = {};

  for (const tenant of tenants) {
    const tenantId = tenant.tenantId;
    const tenantLogger = taskLogger.child({ tenantId });

    try {
      // Find pending transactions older than 24 hours
      const staleTransactions = await PaymentTransactionModel.find({
        tenantId,
        status: 'pending',
        createdAt: { $lt: cutoff },
      }).lean().exec();

      if (staleTransactions.length === 0) {
        tenantLogger.debug('No stale pending transactions');
        continue;
      }

      staleByTenant[tenantId] = staleTransactions.length;
      totalStale += staleTransactions.length;

      // Log warning for each stale transaction
      for (const txn of staleTransactions) {
        const ageHours = Math.floor((Date.now() - new Date(txn.createdAt).getTime()) / MS_PER_HOUR);

        tenantLogger.warn(
          {
            transactionId: txn.transactionId,
            studentId: txn.studentId,
            courseId: txn.courseId,
            amount: txn.amount,
            ageHours,
            createdAt: txn.createdAt,
          },
          'Stale pending payment transaction detected',
        );
      }

      tenantLogger.info(
        { staleCount: staleTransactions.length },
        'Stale pending transactions found for tenant',
      );
    } catch (err) {
      tenantLogger.error({ err }, 'Error processing payment reconciliation for tenant');
      // Continue with next tenant — never crash the task
    }
  }

  taskLogger.info(
    { totalStale, staleByTenant },
    'Payment reconciliation task completed',
  );
}

export const PaymentReconciliationTask = {
  name: TASK_NAME,
  cronExpression: CRON_EXPRESSION,
  execute,
};
