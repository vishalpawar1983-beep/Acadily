import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { Email } from '../value-objects/Email.js';
import { Role, type RoleType } from '../value-objects/Role.js';

interface UserProps {
  tenantId: string;
  email: Email;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  refreshToken?: string;
  otp?: string;
  otpExpiresAt?: Date;
  isOtpVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: RoleType;
}

export class User extends AggregateRoot<UserProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get email(): string {
    return this.props.email.value;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get firstName(): string {
    return this.props.firstName;
  }
  get lastName(): string {
    return this.props.lastName;
  }
  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get role(): RoleType {
    return this.props.role.value;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get refreshToken(): string | undefined {
    return this.props.refreshToken;
  }
  get otp(): string | undefined {
    return this.props.otp;
  }
  get otpExpiresAt(): Date | undefined {
    return this.props.otpExpiresAt;
  }
  get isOtpVerified(): boolean {
    return this.props.isOtpVerified ?? false;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role.isAdmin();
  }

  isSuperAdmin(): boolean {
    return this.props.role.isSuperAdmin();
  }

  setRefreshToken(token: string | undefined): void {
    this.props.refreshToken = token;
    this.props.updatedAt = new Date();
  }

  setOtp(otp: string, expiresAt: Date): void {
    this.props.otp = otp;
    this.props.otpExpiresAt = expiresAt;
    this.props.isOtpVerified = false;
    this.props.updatedAt = new Date();
  }

  clearOtp(): void {
    this.props.otp = undefined;
    this.props.otpExpiresAt = undefined;
    this.props.isOtpVerified = true;
    this.props.updatedAt = new Date();
  }

  isOtpValid(otp: string): boolean {
    if (!this.props.otp || !this.props.otpExpiresAt) return false;
    if (this.props.otpExpiresAt < new Date()) return false;
    return this.props.otp === otp;
  }

  updatePassword(newHash: string): void {
    this.props.passwordHash = newHash;
    this.props.updatedAt = new Date();
  }

  updateDetails(details: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: RoleType;
  }): void {
    if (details.firstName !== undefined) this.props.firstName = details.firstName;
    if (details.lastName !== undefined) this.props.lastName = details.lastName;
    if (details.email !== undefined) this.props.email = Email.create(details.email);
    if (details.phone !== undefined) this.props.phone = details.phone;
    if (details.role !== undefined) this.props.role = Role.create(details.role);
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.refreshToken = undefined;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateUserInput, id?: string): User {
    return new User(
      {
        tenantId: input.tenantId,
        email: Email.create(input.email),
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: Role.create(input.role ?? 'Student'),
        isActive: true,
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
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: RoleType;
      isActive: boolean;
      refreshToken?: string;
      otp?: string;
      otpExpiresAt?: Date;
      isOtpVerified?: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): User {
    return new User(
      {
        ...props,
        email: Email.create(props.email),
        role: Role.create(props.role),
      },
      id,
    );
  }
}
