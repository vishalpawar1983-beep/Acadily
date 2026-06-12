import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    const normalized = email.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new Error(`Invalid email: ${email}`);
    }
    return new Email({ value: normalized });
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
