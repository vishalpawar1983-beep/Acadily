import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export type StudentStatus = 'active' | 'dropout' | 'completed' | 'suspended';

export interface StudentContact {
  mobile: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
}

export interface StudentEnrollment {
  courseId: string;
  courseName: string;
  courseFees: number;
  discount: number;
  netFees: number;
  remainingFees: number;
  totalPaid: number;
  downPayment: number;
  dateOfJoining: Date;
  installmentCount: number;
  installmentAmount: number;
  companyId?: string;
  companyName?: string;
}

interface StudentProps {
  tenantId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  contact: StudentContact;
  dateOfBirth?: Date;
  educationQualification?: string;
  enrollment: StudentEnrollment;
  status: StudentStatus;
  image?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentInput {
  tenantId: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  contact: StudentContact;
  dateOfBirth?: Date;
  educationQualification?: string;
  enrollment: StudentEnrollment;
  image?: string;
  notes?: string;
}

export class Student extends AggregateRoot<StudentProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get rollNumber(): string {
    return this.props.rollNumber;
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
  get fatherName(): string | undefined {
    return this.props.fatherName;
  }
  get contact(): StudentContact {
    return this.props.contact;
  }
  get dateOfBirth(): Date | undefined {
    return this.props.dateOfBirth;
  }
  get educationQualification(): string | undefined {
    return this.props.educationQualification;
  }
  get enrollment(): StudentEnrollment {
    return this.props.enrollment;
  }
  get status(): StudentStatus {
    return this.props.status;
  }
  get image(): string | undefined {
    return this.props.image;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markAsDropout(message?: string): void {
    this.props.status = 'dropout';
    if (message) this.props.notes = message;
    this.props.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.props.status = 'completed';
    this.props.updatedAt = new Date();
  }

  suspend(): void {
    this.props.status = 'suspended';
    this.props.updatedAt = new Date();
  }

  updateDetails(input: {
    firstName?: string;
    lastName?: string;
    fatherName?: string;
    contact?: Partial<StudentContact>;
    dateOfBirth?: Date;
    educationQualification?: string;
    enrollment?: Partial<StudentEnrollment>;
    status?: StudentStatus;
    image?: string;
    notes?: string;
  }): void {
    if (input.firstName !== undefined) this.props.firstName = input.firstName;
    if (input.lastName !== undefined) this.props.lastName = input.lastName;
    if (input.fatherName !== undefined) this.props.fatherName = input.fatherName;
    if (input.contact) {
      this.props.contact = { ...this.props.contact, ...input.contact };
    }
    if (input.dateOfBirth !== undefined) this.props.dateOfBirth = input.dateOfBirth;
    if (input.educationQualification !== undefined)
      this.props.educationQualification = input.educationQualification;
    if (input.enrollment) {
      this.props.enrollment = { ...this.props.enrollment, ...input.enrollment };
    }
    if (input.status !== undefined) this.props.status = input.status;
    if (input.image !== undefined) this.props.image = input.image;
    if (input.notes !== undefined) this.props.notes = input.notes;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateStudentInput, id?: string): Student {
    return new Student(
      {
        tenantId: input.tenantId,
        rollNumber: input.rollNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        fatherName: input.fatherName,
        contact: input.contact,
        dateOfBirth: input.dateOfBirth,
        educationQualification: input.educationQualification,
        enrollment: input.enrollment,
        status: 'active',
        image: input.image,
        notes: input.notes,
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
      rollNumber: string;
      firstName: string;
      lastName: string;
      fatherName?: string;
      contact: StudentContact;
      dateOfBirth?: Date;
      educationQualification?: string;
      enrollment: StudentEnrollment;
      status: StudentStatus;
      image?: string;
      notes?: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Student {
    return new Student(props, id);
  }
}
