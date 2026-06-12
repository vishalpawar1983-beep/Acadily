import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface TeacherProps {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects: string[];
  qualification: string;
  experience: number;
  address: string;
  isActive: boolean;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeacherInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subjects?: string[];
  qualification: string;
  experience?: number;
  address: string;
  joiningDate?: string;
}

export class Teacher extends AggregateRoot<TeacherProps> {
  get tenantId(): string {
    return this.props.tenantId;
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
  get email(): string {
    return this.props.email;
  }
  get phone(): string {
    return this.props.phone;
  }
  get subjects(): string[] {
    return this.props.subjects;
  }
  get qualification(): string {
    return this.props.qualification;
  }
  get experience(): number {
    return this.props.experience;
  }
  get address(): string {
    return this.props.address;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get joiningDate(): Date {
    return this.props.joiningDate;
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
    email?: string;
    phone?: string;
    subjects?: string[];
    qualification?: string;
    experience?: number;
    address?: string;
    joiningDate?: Date;
  }): void {
    if (input.firstName !== undefined) this.props.firstName = input.firstName;
    if (input.lastName !== undefined) this.props.lastName = input.lastName;
    if (input.email !== undefined) this.props.email = input.email;
    if (input.phone !== undefined) this.props.phone = input.phone;
    if (input.subjects !== undefined) this.props.subjects = input.subjects;
    if (input.qualification !== undefined) this.props.qualification = input.qualification;
    if (input.experience !== undefined) this.props.experience = input.experience;
    if (input.address !== undefined) this.props.address = input.address;
    if (input.joiningDate !== undefined) this.props.joiningDate = input.joiningDate;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateTeacherInput, id?: string): Teacher {
    return new Teacher(
      {
        tenantId: input.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        subjects: input.subjects ?? [],
        qualification: input.qualification,
        experience: input.experience ?? 0,
        address: input.address,
        isActive: true,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
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
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      subjects: string[];
      qualification: string;
      experience: number;
      address: string;
      isActive: boolean;
      joiningDate: Date;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Teacher {
    return new Teacher(props, id);
  }
}
