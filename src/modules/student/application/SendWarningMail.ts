import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface SendWarningMailRequest {
  tenantId: string;
  studentId: string;
  templateData?: Record<string, unknown>;
}

export interface SendWarningMailResponse {
  message: string;
  studentId: string;
  email?: string;
}

export class SendWarningMail implements UseCase<SendWarningMailRequest, SendWarningMailResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: SendWarningMailRequest): Promise<SendWarningMailResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    const email = student.contact.email;

    if (!email) {
      logger.warn({ studentId: request.studentId }, 'Student has no email address, skipping warning mail');
      return { message: 'Warning mail skipped — no email on file', studentId: student.id };
    }

    try {
      const emailService = new EmailService();
      const studentName = student.fullName;
      await emailService.send({
        to: email,
        subject: 'Warning Notice - Flex Academy',
        html: `<p>Dear ${studentName},</p>
<p>This is a warning notice regarding your enrollment status. Please contact the administration for further details.</p>
<p>Regards,<br/>Flex Academy</p>`,
        tenantId: request.tenantId,
        sentBy: 'Admin',
      });
    } catch (err) {
      logger.error({ err, studentId: request.studentId }, 'Failed to send warning mail');
    }

    return {
      message: 'Warning mail processed successfully',
      studentId: student.id,
      email,
    };
  }
}
