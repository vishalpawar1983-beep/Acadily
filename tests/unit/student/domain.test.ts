import { describe, it, expect } from '@jest/globals';
import { Student } from '../../../src/modules/student/domain/entities/Student';

const enrollment = {
  courseId: 'course-1',
  courseName: 'BCA',
  courseFees: 50000,
  discount: 5000,
  netFees: 45000,
  remainingFees: 35000,
  totalPaid: 10000,
  downPayment: 10000,
  dateOfJoining: new Date('2026-01-15'),
  installmentCount: 5,
  installmentAmount: 7000,
};

const validInput = {
  tenantId: 'tenant_1',
  rollNumber: 'BCA-001',
  firstName: 'Ravi',
  lastName: 'Kumar',
  contact: { mobile: '9876543210', email: 'ravi@test.com' },
  enrollment,
};

describe('Student entity', () => {
  it('should create with active status', () => {
    const student = Student.create(validInput);
    expect(student.rollNumber).toBe('BCA-001');
    expect(student.fullName).toBe('Ravi Kumar');
    expect(student.status).toBe('active');
    expect(student.tenantId).toBe('tenant_1');
    expect(student.enrollment.netFees).toBe(45000);
    expect(student.id).toBeDefined();
  });

  it('should mark as dropout with message', () => {
    const student = Student.create(validInput);
    student.markAsDropout('Financial reasons');
    expect(student.status).toBe('dropout');
    expect(student.notes).toBe('Financial reasons');
  });

  it('should mark as completed', () => {
    const student = Student.create(validInput);
    student.markAsCompleted();
    expect(student.status).toBe('completed');
  });

  it('should suspend', () => {
    const student = Student.create(validInput);
    student.suspend();
    expect(student.status).toBe('suspended');
  });

  it('should update details partially', () => {
    const student = Student.create(validInput);
    student.updateDetails({
      firstName: 'Rajesh',
      contact: { city: 'Mumbai' },
    });
    expect(student.firstName).toBe('Rajesh');
    expect(student.lastName).toBe('Kumar'); // unchanged
    expect(student.contact.mobile).toBe('9876543210'); // merged
    expect(student.contact.city).toBe('Mumbai');
  });

  it('should update enrollment partially', () => {
    const student = Student.create(validInput);
    student.updateDetails({
      enrollment: { totalPaid: 20000, remainingFees: 25000 },
    });
    expect(student.enrollment.totalPaid).toBe(20000);
    expect(student.enrollment.remainingFees).toBe(25000);
    expect(student.enrollment.courseName).toBe('BCA'); // unchanged
  });

  it('should reconstitute from persisted data', () => {
    const now = new Date();
    const student = Student.reconstitute('stu-123', {
      ...validInput,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    });
    expect(student.id).toBe('stu-123');
    expect(student.status).toBe('completed');
  });
});
