import cron, { type ScheduledTask } from 'node-cron';
import { config } from '../../../config/index.js';
import { logger } from '../logger/PinoLogger.js';

export type TaskHandler = () => Promise<void>;

interface RegisteredTask {
  name: string;
  cronExpression: string;
  handler: TaskHandler;
  task: ScheduledTask | null;
}

export class SchedulerService {
  private static instance: SchedulerService | null = null;
  private tasks: Map<string, RegisteredTask> = new Map();
  private running = false;
  private runningTasks: Set<Promise<void>> = new Set();

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  register(name: string, cronExpression: string, handler: TaskHandler): void {
    if (this.tasks.has(name)) {
      logger.warn({ task: name }, 'Scheduler: task already registered, overwriting');
    }

    if (!cron.validate(cronExpression)) {
      logger.error({ task: name, cronExpression }, 'Scheduler: invalid cron expression');
      throw new Error(`Invalid cron expression "${cronExpression}" for task "${name}"`);
    }

    this.tasks.set(name, {
      name,
      cronExpression,
      handler,
      task: null,
    });

    logger.info({ task: name, cronExpression }, 'Scheduler: task registered');
  }

  start(): void {
    if (this.running) {
      logger.warn('Scheduler: already running');
      return;
    }

    for (const [name, registered] of this.tasks) {
      const wrappedHandler = this.wrapHandler(name, registered.handler);
      registered.task = cron.schedule(registered.cronExpression, wrappedHandler, {
        timezone: config.SCHEDULER_TIMEZONE,
      });
      logger.info(
        { task: name, cronExpression: registered.cronExpression },
        'Scheduler: task started',
      );
    }

    this.running = true;
    logger.info(
      { taskCount: this.tasks.size },
      'Scheduler: all tasks started',
    );
  }

  async stop(): Promise<void> {
    if (!this.running) {
      logger.warn('Scheduler: not running');
      return;
    }

    // Stop scheduling new executions
    for (const [name, registered] of this.tasks) {
      if (registered.task) {
        registered.task.stop();
        registered.task = null;
        logger.info({ task: name }, 'Scheduler: task stopped');
      }
    }

    // Wait for in-flight tasks to complete
    if (this.runningTasks.size > 0) {
      logger.info(
        { inFlightCount: this.runningTasks.size },
        'Scheduler: waiting for in-flight tasks to complete',
      );
      await this.waitForCompletion(25000);
    }

    this.running = false;
    logger.info('Scheduler: all tasks stopped');
  }

  async waitForCompletion(timeoutMs: number): Promise<void> {
    if (this.runningTasks.size === 0) return;

    const deadline = Date.now() + timeoutMs;

    // Poll until all tasks complete or timeout
    while (this.runningTasks.size > 0) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        logger.warn(
          { remainingTasks: this.runningTasks.size },
          'Scheduler: timed out waiting for in-flight tasks',
        );
        return;
      }

      // Wait for current batch, but no longer than the remaining time
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, Math.min(remaining, 500)));
      const batch = Promise.allSettled([...this.runningTasks]).then(() => {});

      await Promise.race([batch, timeout]);
    }
  }

  getRegisteredTasks(): Array<{ name: string; cronExpression: string; running: boolean }> {
    return Array.from(this.tasks.values()).map((t) => ({
      name: t.name,
      cronExpression: t.cronExpression,
      running: t.task !== null,
    }));
  }

  private wrapHandler(name: string, handler: TaskHandler): () => void {
    return () => {
      const startTime = Date.now();
      logger.info({ task: name }, 'Scheduler: task execution started');

      const taskPromise = handler()
        .then(() => {
          const durationMs = Date.now() - startTime;
          logger.info({ task: name, durationMs }, 'Scheduler: task execution completed');
        })
        .catch((err: unknown) => {
          const durationMs = Date.now() - startTime;
          logger.error(
            { task: name, durationMs, err },
            'Scheduler: task execution failed',
          );
        })
        .finally(() => {
          this.runningTasks.delete(taskPromise);
        });

      this.runningTasks.add(taskPromise);
    };
  }
}
