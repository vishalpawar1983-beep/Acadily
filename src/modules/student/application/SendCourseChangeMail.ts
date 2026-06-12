import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface SendCourseChangeMailRequest {
  tenantId: string;
  studentId: string;
  newCourseId: string;
  newCourseName: string;
  additionalDetails?: Record<string, unknown>;
}

export interface SendCourseChangeMailResponse {
  message: string;
  studentId: string;
  email?: string;
}

export class SendCourseChangeMail implements UseCase<SendCourseChangeMailRequest, SendCourseChangeMailResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: SendCourseChangeMailRequest): Promise<SendCourseChangeMailResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    const email = student.contact.email;

    if (!email) {
      logger.warn({ studentId: request.studentId }, 'Student has no email address, skipping course change mail');
      return { message: 'Course change mail skipped — no email on file', studentId: student.id };
    }

    try {
      const emailService = new EmailService();
      const studentName = student.fullName;
      await emailService.send({
        to: email,
        subject: 'Course Change Notification - Flex Academy',
        html: `<p>Dear ${studentName},</p>
<p>Your course has been changed to <strong>${request.newCourseName}</strong>.</p>
<p>If you have any questions, please contact the administration.</p>
<p>Regards,<br/>Flex Academy</p>`,
      });
    } catch (err) {
      logger.error({ err, studentId: request.studentId }, 'Failed to send course change mail');
    }

    return {
      message: 'Course change mail processed successfully',
      studentId: student.id,
      email,
    };
  }
}
