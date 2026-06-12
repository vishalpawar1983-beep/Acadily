import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

export interface BatchStudentSubject {
  subjectName: string;
  status: 'notStarted' | 'inProgress' | 'completed';
  progress: number;
  startDate?: Date;
  completionDate?: Date;
  notes?: string;
}

export interface BatchStudent {
  studentId: string;
  subjects: BatchStudentSubject[];
  currentSoftware?: string;
}

interface BatchProps {
  tenantId: string;
  name: string;
  courseCategory: string;
  course: string;
  trainer: string;
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate?: Date;
  status: 'completed' | 'inProgress';
  students: BatchStudent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBatchInput {
  tenantId: string;
  name: string;
  courseCategory?: string;
  course?: string;
  trainer?: string;
  startTime?: string;
  endTime?: string;
  startDate: string;
  endDate?: string;
  status?: 'completed' | 'inProgress';
  students?: BatchStudent[];
}

export class Batch extends AggregateRoot<BatchProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get courseCategory(): string {
    return this.props.courseCategory;
  }
  get course(): string {
    return this.props.course;
  }
  get trainer(): string {
    return this.props.trainer;
  }
  get startTime(): string {
    return this.props.startTime;
  }
  get endTime(): string {
    return this.props.endTime;
  }
  get startDate(): Date {
    return this.props.startDate;
  }
  get endDate(): Date | undefined {
    return this.props.endDate;
  }
  get status(): 'completed' | 'inProgress' {
    return this.props.status;
  }
  get students(): BatchStudent[] {
    return this.props.students;
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
    name?: string;
    courseCategory?: string;
    course?: string;
    trainer?: string;
    startTime?: string;
    endTime?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'completed' | 'inProgress';
    isActive?: boolean;
  }): void {
    if (input.name !== undefined) this.props.name = input.name;
    if (input.courseCategory !== undefined) this.props.courseCategory = input.courseCategory;
    if (input.course !== undefined) this.props.course = input.course;
    if (input.trainer !== undefined) this.props.trainer = input.trainer;
    if (input.startTime !== undefined) this.props.startTime = input.startTime;
    if (input.endTime !== undefined) this.props.endTime = input.endTime;
    if (input.startDate !== undefined) this.props.startDate = input.startDate;
    if (input.endDate !== undefined) this.props.endDate = input.endDate;
    if (input.status !== undefined) this.props.status = input.status;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  addStudent(student: BatchStudent): void {
    const exists = this.props.students.find((s) => s.studentId === student.studentId);
    if (exists) {
      throw new Error(`Student ${student.studentId} is already in this batch`);
    }
    this.props.students.push(student);
    this.props.updatedAt = new Date();
  }

  removeStudent(studentId: string): void {
    const index = this.props.students.findIndex((s) => s.studentId === studentId);
    if (index === -1) {
      throw new Error(`Student ${studentId} is not in this batch`);
    }
    this.props.students.splice(index, 1);
    this.props.updatedAt = new Date();
  }

  static create(input: CreateBatchInput, id?: string): Batch {
    return new Batch(
      {
        tenantId: input.tenantId,
        name: input.name,
        courseCategory: input.courseCategory ?? '',
        course: input.course ?? '',
        trainer: input.trainer ?? '',
        startTime: input.startTime ?? '',
        endTime: input.endTime ?? '',
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: input.status ?? 'inProgress',
        students: input.students ?? [],
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
      name: string;
      courseCategory: string;
      course: string;
      trainer: string;
      startTime: string;
      endTime: string;
      startDate: Date;
      endDate?: Date;
      status: 'completed' | 'inProgress';
      students: BatchStudent[];
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Batch {
    return new Batch(props, id);
  }
}
