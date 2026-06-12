import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface Communications {
  email: boolean;
  phone: boolean;
}

interface ProfileDetailsProps {
  tenantId: string;
  userId: string;
  firstName: string;
  lastName: string;
  company: string;
  contactPhone: string;
  companySite: string;
  country: string;
  language: string;
  timeZone: string;
  currency: string;
  communications: Communications;
  allowMarketing: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileDetailsInput {
  tenantId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  contactPhone?: string;
  companySite?: string;
  country?: string;
  language?: string;
  timeZone?: string;
  currency?: string;
  communications?: Communications;
  allowMarketing?: boolean;
}

export class ProfileDetails extends AggregateRoot<ProfileDetailsProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get company(): string {
    return this.props.company;
  }
  get contactPhone(): string {
    return this.props.contactPhone;
  }
  get companySite(): string {
    return this.props.companySite;
  }
  get country(): string {
    return this.props.country;
  }
  get language(): string {
    return this.props.language;
  }
  get timeZone(): string {
    return this.props.timeZone;
  }
  get currency(): string {
    return this.props.currency;
  }
  get communications(): Communications {
    return this.props.communications;
  }
  get allowMarketing(): boolean {
    return this.props.allowMarketing;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    firstName?: string;
    lastName?: string;
    company?: string;
    contactPhone?: string;
    companySite?: string;
    country?: string;
    language?: string;
    timeZone?: string;
    currency?: string;
    communications?: Communications;
    allowMarketing?: boolean;
  }): void {
    if (input.firstName !== undefined) this.props.firstName = input.firstName;
    if (input.lastName !== undefined) this.props.lastName = input.lastName;
    if (input.company !== undefined) this.props.company = input.company;
    if (input.contactPhone !== undefined) this.props.contactPhone = input.contactPhone;
    if (input.companySite !== undefined) this.props.companySite = input.companySite;
    if (input.country !== undefined) this.props.country = input.country;
    if (input.language !== undefined) this.props.language = input.language;
    if (input.timeZone !== undefined) this.props.timeZone = input.timeZone;
    if (input.currency !== undefined) this.props.currency = input.currency;
    if (input.communications !== undefined) this.props.communications = input.communications;
    if (input.allowMarketing !== undefined) this.props.allowMarketing = input.allowMarketing;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateProfileDetailsInput, id?: string): ProfileDetails {
    return new ProfileDetails(
      {
        tenantId: input.tenantId,
        userId: input.userId,
        firstName: input.firstName ?? '',
        lastName: input.lastName ?? '',
        company: input.company ?? '',
        contactPhone: input.contactPhone ?? '',
        companySite: input.companySite ?? '',
        country: input.country ?? '',
        language: input.language ?? '',
        timeZone: input.timeZone ?? '',
        currency: input.currency ?? '',
        communications: input.communications ?? { email: false, phone: false },
        allowMarketing: input.allowMarketing ?? false,
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
      userId: string;
      firstName: string;
      lastName: string;
      company: string;
      contactPhone: string;
      companySite: string;
      country: string;
      language: string;
      timeZone: string;
      currency: string;
      communications: Communications;
      allowMarketing: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): ProfileDetails {
    return new ProfileDetails(props, id);
  }
}
