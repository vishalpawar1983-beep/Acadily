import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface SendCancellationMailRequest {
  tenantId: string;
  studentId: string;
  templateData?: Record<string, unknown>;
}

export interface SendCancellationMailResponse {
  message: string;
  studentId: string;
  email?: string;
}

export class SendCancellationMail implements UseCase<SendCancellationMailRequest, SendCancellationMailResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: SendCancellationMailRequest): Promise<SendCancellationMailResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    const email = student.contact.email;

    if (!email) {
      logger.warn({ studentId: request.studentId }, 'Student has no email address, skipping cancellation mail');
      return { message: 'Cancellation mail skipped — no email on file', studentId: student.id };
    }

    try {
      const emailService = new EmailService();
      const studentName = student.fullName;
      await emailService.send({
        to: email,
        subject: 'Enrollment Cancellation - Flex Academy',
        html: `<p>Dear ${studentName},</p>
<p>Your enrollment has been cancelled. If you believe this is in error, please contact the administration immediately.</p>
<p>Regards,<br/>Flex Academy</p>`,
        tenantId: request.tenantId,
        sentBy: 'Admin',
      });
    } catch (err) {
      logger.error({ err, studentId: request.studentId }, 'Failed to send cancellation mail');
    }

    return {
      message: 'Cancellation mail processed successfully',
      studentId: student.id,
      email,
    };
  }
}
