import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface SubjectProps {
  name: string;
  code: string;
  fullMarks: number;
  passMarks: number;
  semester: number;
}

interface CourseProps {
  tenantId: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects: SubjectProps[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseInput {
  tenantId: string;
  name: string;
  fees: number;
  courseType: string;
  durationYears: number;
  category: string;
  subjects?: SubjectProps[];
  createdBy: string;
}

export class Course extends AggregateRoot<CourseProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get fees(): number {
    return this.props.fees;
  }
  get courseType(): string {
    return this.props.courseType;
  }
  get durationYears(): number {
    return this.props.durationYears;
  }
  get category(): string {
    return this.props.category;
  }
  get subjects(): SubjectProps[] {
    return this.props.subjects;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    name?: string;
    fees?: number;
    courseType?: string;
    durationYears?: number;
    category?: string;
    subjects?: SubjectProps[];
    isActive?: boolean;
  }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.fees !== undefined) this.props.fees = input.fees;
    if (input.courseType !== undefined) this.props.courseType = input.courseType;
    if (input.durationYears !== undefined) this.props.durationYears = input.durationYears;
    if (input.category !== undefined) this.props.category = input.category;
    if (input.subjects !== undefined) this.props.subjects = input.subjects;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateCourseInput, id?: string): Course {
    return new Course(
      {
        tenantId: input.tenantId,
        name: input.name,
        fees: input.fees,
        courseType: input.courseType,
        durationYears: input.durationYears,
        category: input.category,
        subjects: input.subjects ?? [],
        isActive: true,
        createdBy: input.createdBy,
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
      name: string;
      fees: number;
      courseType: string;
      durationYears: number;
      category: string;
      subjects: SubjectProps[];
      isActive: boolean;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Course {
    return new Course(props, id);
  }
}
