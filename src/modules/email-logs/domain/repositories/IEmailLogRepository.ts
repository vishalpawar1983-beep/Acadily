import type { EmailLog } from '../entities/EmailLog.js';

export interface FindAllEmailLogsOptions {
  skip?: number;
  limit?: number;
}

export interface IEmailLogRepository {
  findAll(
    tenantId: string,
    options?: FindAllEmailLogsOptions,
  ): Promise<{ emailLogs: EmailLog[]; total: number }>;
}
