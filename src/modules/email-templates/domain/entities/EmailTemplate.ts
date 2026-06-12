import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface EmailTemplateProps {
  tenantId: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateInput {
  tenantId: string;
  templateName: string;
  subject: string;
  body: string;
  isActive?: boolean;
}

export class EmailTemplate extends AggregateRoot<EmailTemplateProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get templateName(): string {
    return this.props.templateName;
  }
  get subject(): string {
    return this.props.subject;
  }
  get body(): string {
    return this.props.body;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    templateName?: string;
    subject?: string;
    body?: string;
    isActive?: boolean;
  }): void {
    if (input.templateName !== undefined) this.props.templateName = input.templateName;
    if (input.subject !== undefined) this.props.subject = input.subject;
    if (input.body !== undefined) this.props.body = input.body;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateEmailTemplateInput, id?: string): EmailTemplate {
    return new EmailTemplate(
      {
        tenantId: input.tenantId,
        templateName: input.templateName,
        subject: input.subject,
        body: input.body,
        isActive: input.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(
    id: string,
    props: {
      tenantId: string;
      templateName: string;
      subject: string;
      body: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): EmailTemplate {
    return new EmailTemplate(props, id);
  }
}
