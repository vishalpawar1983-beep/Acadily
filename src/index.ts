import { config } from './config/index.js';
import { logger } from './shared/infrastructure/logger/PinoLogger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { createServer } from './server.js';
import { SchedulerService } from './shared/infrastructure/scheduler/SchedulerService.js';
import { LateFeeCalculatorTask } from './shared/infrastructure/scheduler/tasks/LateFeeCalculatorTask.js';
import { FeeReminderTask } from './shared/infrastructure/scheduler/tasks/FeeReminderTask.js';
import { PaymentReconciliationTask } from './shared/infrastructure/scheduler/tasks/PaymentReconciliationTask.js';

async function main() {
  // Connect to MongoDB
  await connectDatabase();

  // Start scheduled tasks (only on first PM2 instance to prevent duplicates)
  const instanceId = process.env.NODE_APP_INSTANCE ?? '0';
  if (instanceId === '0') {
    const scheduler = SchedulerService.getInstance();
    scheduler.register(LateFeeCalculatorTask.name, LateFeeCalculatorTask.cronExpression, LateFeeCalculatorTask.execute);
    scheduler.register(FeeReminderTask.name, FeeReminderTask.cronExpression, FeeReminderTask.execute);
    scheduler.register(PaymentReconciliationTask.name, PaymentReconciliationTask.cronExpression, PaymentReconciliationTask.execute);
    scheduler.start();
    logger.info('Scheduler started on primary instance');
  } else {
    logger.info({ instanceId }, 'Scheduler skipped on secondary instance');
  }

  // Create and start server
  const app = createServer();
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV },
      `Flex Academy API started on port ${config.PORT}`
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      if (instanceId === '0') {
        await SchedulerService.getInstance().stop();
      }
      await disconnectDatabase();
      logger.info('Server shut down gracefully');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception — shutting down');
    process.exit(1);
  });
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start application');
  process.exit(1);
});
