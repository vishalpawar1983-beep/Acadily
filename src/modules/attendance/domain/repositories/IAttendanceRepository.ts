import { Attendance } from '../entities/Attendance.js';

export interface IAttendanceRepository {
  findByBatchAndMonth(
    tenantId: string,
    batchId: string,
    month: number,
    year: number,
  ): Promise<Attendance | null>;

  save(attendance: Attendance): Promise<Attendance>;

  update(attendance: Attendance): Promise<Attendance>;

  findByStudent(
    tenantId: string,
    studentId: string,
    options?: { month?: number; year?: number },
  ): Promise<Attendance[]>;
}
