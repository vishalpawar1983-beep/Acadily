import { EmailLog } from '../domain/entities/EmailLog.js';
import type {
  IEmailLogRepository,
  FindAllEmailLogsOptions,
} from '../domain/repositories/IEmailLogRepository.js';
import { EmailLogModel, type IEmailLogDocument } from './EmailLogModel.js';

export class MongoEmailLogRepository implements IEmailLogRepository {
  async findAll(
    tenantId: string,
    options: FindAllEmailLogsOptions = {},
  ): Promise<{ emailLogs: EmailLog[]; total: number }> {
    const filter = { tenantId };

    const [docs, total] = await Promise.all([
      EmailLogModel.find(filter)
        .skip(options.skip ?? 0)
        .limit(options.limit ?? 20)
        .sort({ sentAt: -1 })
        .exec(),
      EmailLogModel.countDocuments(filter).exec(),
    ]);

    return {
      emailLogs: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  private toDomain(doc: IEmailLogDocument): EmailLog {
    return EmailLog.reconstitute(doc._id.toString(), {
      tenantId: doc.tenantId,
      recipients: doc.recipients,
      subject: doc.subject,
      content: doc.content,
      sender: doc.sender,
      sentAt: doc.sentAt,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
