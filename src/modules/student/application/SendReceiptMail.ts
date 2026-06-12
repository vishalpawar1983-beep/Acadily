import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IStudentRepository } from '../domain/repositories/IStudentRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { logger } from '../../../shared/infrastructure/logger/PinoLogger.js';

export interface SendReceiptMailRequest {
  tenantId: string;
  studentId: string;
  paymentId?: string;
  paymentDetails?: Record<string, unknown>;
}

export interface SendReceiptMailResponse {
  message: string;
  studentId: string;
  email?: string;
}

export class SendReceiptMail implements UseCase<SendReceiptMailRequest, SendReceiptMailResponse> {
  constructor(private readonly studentRepo: IStudentRepository) {}

  async execute(request: SendReceiptMailRequest): Promise<SendReceiptMailResponse> {
    const student = await this.studentRepo.findById(request.tenantId, request.studentId);
    if (!student) {
      throw new NotFoundError('Student', request.studentId);
    }

    const email = student.contact.email;

    if (!email) {
      logger.warn({ studentId: request.studentId }, 'Student has no email address, skipping receipt mail');
      return { message: 'Receipt mail skipped — no email on file', studentId: student.id };
    }

    try {
      const emailService = new EmailService();
      const studentName = student.fullName;
      const paymentId = request.paymentId ?? 'N/A';
      const amount = request.paymentDetails?.amount ?? 'N/A';
      await emailService.send({
        to: email,
        tenantId: request.tenantId,
        sentBy: 'Admin',
        subject: 'Payment Receipt - Flex Academy',
        html: `<p>Dear ${studentName},</p>
<p>Your payment has been received successfully.</p>
<p><strong>Payment ID:</strong> ${paymentId}<br/>
<strong>Amount:</strong> ${amount}</p>
<p>Thank you for your payment.</p>
<p>Regards,<br/>Flex Academy</p>`,
      });
    } catch (err) {
      logger.error({ err, studentId: request.studentId }, 'Failed to send receipt mail');
    }

    return {
      message: 'Receipt mail processed successfully',
      studentId: student.id,
      email,
    };
  }
}
