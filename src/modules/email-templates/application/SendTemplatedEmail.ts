import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IEmailTemplateRepository } from '../domain/repositories/IEmailTemplateRepository.js';
import { EmailService } from '../../../shared/infrastructure/email/EmailService.js';
import { TemplateEngine } from '../../../shared/infrastructure/email/TemplateEngine.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface SendTemplatedEmailRequest {
  tenantId: string;
  templateName: string;
  recipientEmail: string | string[];
  variables: Record<string, unknown>;
}

export interface SendTemplatedEmailResponse {
  sent: boolean;
  templateName: string;
}

export class SendTemplatedEmail
  implements UseCase<SendTemplatedEmailRequest, SendTemplatedEmailResponse>
{
  constructor(
    private readonly repo: IEmailTemplateRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(request: SendTemplatedEmailRequest): Promise<SendTemplatedEmailResponse> {
    const template = await this.repo.findByName(request.tenantId, request.templateName);
    if (!template) {
      throw new NotFoundError('EmailTemplate', request.templateName);
    }

    const compiledSubject = TemplateEngine.compile(template.subject, request.variables);
    const compiledBody = TemplateEngine.compile(template.body, request.variables);

    const sent = await this.emailService.send({
      to: request.recipientEmail,
      subject: compiledSubject,
      html: compiledBody,
    });

    return {
      sent,
      templateName: request.templateName,
    };
  }
}
