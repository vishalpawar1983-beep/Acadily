import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailLogRepository } from '../domain/repositories/IEmailLogRepository.js';

export interface ListEmailLogsRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
}

export interface ListEmailLogsResponse {
  emailLogs: Array<{
    id: string;
    recipients: string[];
    subject: string;
    content: string;
    sender: string;
    sentAt: Date;
    status: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListEmailLogs implements UseCase<ListEmailLogsRequest, ListEmailLogsResponse> {
  constructor(private readonly repo: IEmailLogRepository) {}

  async execute(request: ListEmailLogsRequest): Promise<ListEmailLogsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { emailLogs, total } = await this.repo.findAll(request.tenantId, { skip, limit });

    return {
      emailLogs: emailLogs.map((log) => ({
        id: log.id,
        recipients: log.recipients,
        subject: log.subject,
        content: log.content,
        sender: log.sender,
        sentAt: log.sentAt,
        status: log.status,
        createdAt: log.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
