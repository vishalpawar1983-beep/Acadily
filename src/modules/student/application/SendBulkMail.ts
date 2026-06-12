import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface SendBulkMailRequest {
  tenantId: string;
  studentIds: string[];
  subject: string;
  content: string;
}

export interface SendBulkMailResponse {
  message: string;
  totalRecipients: number;
  sent: number;
  failed: number;
}

export class SendBulkMail implements UseCase<SendBulkMailRequest, SendBulkMailResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: SendBulkMailRequest): Promise<SendBulkMailResponse> {
    const students = await Promise.all(
      request.studentIds.map((id) => this.studentRepo.findById(request.tenantId, id)),
    );

    const validStudents = students.filter((s) => s !== null);
    const emailRecipients = validStudents.filter((s) => s.contact.email);

    const emailService = new EmailService();
    let sent = 0;
    let failed = 0;
    for (const student of emailRecipients) {
      try {
        await emailService.send({
          to: student.contact.email!,
          subject: request.subject,
          html: request.content,
        });
        sent++;
      } catch (err) {
        logger.error({ err, email: student.contact.email }, 'Failed to send bulk mail to recipient');
        failed++;
      }
    }

    return {
      message: 'Bulk mail processed successfully',
      totalRecipients: emailRecipients.length,
      sent,
      failed,
    };
  }
}
