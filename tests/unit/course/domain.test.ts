import { describe, it, expect } from '@jest/globals';
import { Course } from '../../../src/modules/course/domain/entities/Course';

const validInput = {
  tenantId: 'tenant_1',
  name: 'BCA',
  fees: 50000,
  courseType: 'Degree',
  durationYears: 3,
  category: 'Computer Science',
  createdBy: 'user-1',
};

describe('Course entity', () => {
  it('should create with defaults', () => {
    const course = Course.create(validInput);
    expect(course.name).toBe('BCA');
    expect(course.fees).toBe(50000);
    expect(course.courseType).toBe('Degree');
    expect(course.durationYears).toBe(3);
    expect(course.isActive).toBe(true);
    expect(course.subjects).toEqual([]);
    expect(course.id).toBeDefined();
  });

  it('should create with subjects', () => {
    const subjects = [
      { name: 'Math', code: 'MTH101', fullMarks: 100, passMarks: 33, semester: 1 },
      { name: 'C Programming', code: 'CS101', fullMarks: 100, passMarks: 33, semester: 1 },
    ];
    const course = Course.create({ ...validInput, subjects });
    expect(course.subjects).toHaveLength(2);
    expect(course.subjects[0].name).toBe('Math');
  });

  it('should update details', () => {
    const course = Course.create(validInput);
    course.updateDetails({ name: 'MCA', fees: 80000, durationYears: 2 });
    expect(course.name).toBe('MCA');
    expect(course.fees).toBe(80000);
    expect(course.durationYears).toBe(2);
    expect(course.category).toBe('Computer Science'); // unchanged
  });

  it('should deactivate via updateDetails', () => {
    const course = Course.create(validInput);
    course.updateDetails({ isActive: false });
    expect(course.isActive).toBe(false);
  });

  it('should replace subjects list', () => {
    const course = Course.create(validInput);
    course.updateDetails({
      subjects: [{ name: 'Physics', code: 'PHY101', fullMarks: 100, passMarks: 33, semester: 1 }],
    });
    expect(course.subjects).toHaveLength(1);
    expect(course.subjects[0].name).toBe('Physics');
  });

  it('should reconstitute from persisted data', () => {
    const now = new Date();
    const course = Course.reconstitute('crs-123', {
      ...validInput,
      subjects: [],
      isActive: false,
      createdAt: now,
      updatedAt: now,
    });
    expect(course.id).toBe('crs-123');
    expect(course.isActive).toBe(false);
  });
});
