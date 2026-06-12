import { describe, it, expect } from '@jest/globals';
import { Attendance } from '../../../src/modules/attendance/domain/entities/Attendance';

describe('Attendance entity', () => {
  it('should create with empty records', () => {
    const att = Attendance.create({
      tenantId: 'tenant_1',
      batchId: 'batch-1',
      month: 2,
      year: 2026,
    });
    expect(att.batchId).toBe('batch-1');
    expect(att.month).toBe(2);
    expect(att.year).toBe(2026);
    expect(att.records).toHaveLength(0);
    expect(att.id).toBeDefined();
  });

  it('should reject invalid month', () => {
    expect(() =>
      Attendance.create({ tenantId: 't', batchId: 'b', month: 12, year: 2026 }),
    ).toThrow('Invalid month');

    expect(() =>
      Attendance.create({ tenantId: 't', batchId: 'b', month: -1, year: 2026 }),
    ).toThrow('Invalid month');
  });

  it('should mark attendance for a student', () => {
    const att = Attendance.create({
      tenantId: 'tenant_1',
      batchId: 'batch-1',
      month: 0,
      year: 2026,
    });

    att.markAttendance('stu-1', 1, 'P');
    att.markAttendance('stu-1', 2, 'A');
    att.markAttendance('stu-2', 1, 'P');

    expect(att.records).toHaveLength(2);

    const stu1 = att.getStudentAttendance('stu-1');
    expect(stu1).not.toBeNull();
    expect(stu1!.days['1']).toBe('P');
    expect(stu1!.days['2']).toBe('A');
  });

  it('should overwrite existing day entry', () => {
    const att = Attendance.create({
      tenantId: 't',
      batchId: 'b',
      month: 5,
      year: 2026,
    });

    att.markAttendance('stu-1', 10, 'P');
    att.markAttendance('stu-1', 10, 'A');

    const record = att.getStudentAttendance('stu-1');
    expect(record!.days['10']).toBe('A');
  });

  it('should reject invalid day', () => {
    const att = Attendance.create({
      tenantId: 't',
      batchId: 'b',
      month: 3,
      year: 2026,
    });

    expect(() => att.markAttendance('stu-1', 0, 'P')).toThrow('Invalid day');
    expect(() => att.markAttendance('stu-1', 32, 'P')).toThrow('Invalid day');
  });

  it('should reject invalid status', () => {
    const att = Attendance.create({
      tenantId: 't',
      batchId: 'b',
      month: 3,
      year: 2026,
    });

    expect(() => att.markAttendance('stu-1', 1, 'X' as any)).toThrow('Invalid status');
  });

  it('should return null for unknown student', () => {
    const att = Attendance.create({
      tenantId: 't',
      batchId: 'b',
      month: 0,
      year: 2026,
    });
    expect(att.getStudentAttendance('nonexistent')).toBeNull();
  });

  it('should reconstitute from persisted data', () => {
    const now = new Date();
    const att = Attendance.reconstitute('att-123', {
      tenantId: 't',
      batchId: 'b',
      month: 6,
      year: 2026,
      records: [{ studentId: 'stu-1', days: { '1': 'P', '2': 'A' } }],
      createdAt: now,
      updatedAt: now,
    });
    expect(att.id).toBe('att-123');
    expect(att.records).toHaveLength(1);
    expect(att.getStudentAttendance('stu-1')!.days['1']).toBe('P');
  });
});
