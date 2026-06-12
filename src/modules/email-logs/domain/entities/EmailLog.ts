import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface EmailLogProps {
  tenantId: string;
  recipients: string[];
  subject: string;
  content: string;
  sender: string;
  sentAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailLogInput {
  tenantId: string;
  recipients: string[];
  subject: string;
  content: string;
  sender: string;
  sentAt?: string;
  status?: string;
}

export class EmailLog extends AggregateRoot<EmailLogProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get recipients(): string[] {
    return this.props.recipients;
  }
  get subject(): string {
    return this.props.subject;
  }
  get content(): string {
    return this.props.content;
  }
  get sender(): string {
    return this.props.sender;
  }
  get sentAt(): Date {
    return this.props.sentAt;
  }
  get status(): string {
    return this.props.status;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: CreateEmailLogInput, id?: string): EmailLog {
    return new EmailLog(
      {
        tenantId: input.tenantId,
        recipients: input.recipients,
        subject: input.subject,
        content: input.content,
        sender: input.sender,
        sentAt: input.sentAt ? new Date(input.sentAt) : new Date(),
        status: input.status ?? 'sent',
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
      recipients: string[];
      subject: string;
      content: string;
      sender: string;
      sentAt: Date;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): EmailLog {
    return new EmailLog(props, id);
  }
}
