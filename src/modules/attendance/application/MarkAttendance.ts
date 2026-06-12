import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IAttendanceRepository } from '../domain/repositories/IAttendanceRepository.js';
import { Attendance, type AttendanceStatus } from '../domain/entities/Attendance.js';

export interface MarkAttendanceRequest {
  tenantId: string;
  batchId: string;
  studentId: string;
  day: number;
  month: number;
  year: number;
  status: AttendanceStatus;
}

export interface MarkAttendanceResponse {
  id: string;
  batchId: string;
  month: number;
  year: number;
  studentId: string;
  day: number;
  status: AttendanceStatus;
}

export class MarkAttendance implements UseCase<MarkAttendanceRequest, MarkAttendanceResponse> {
  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  async execute(request: MarkAttendanceRequest): Promise<MarkAttendanceResponse> {
    const { tenantId, batchId, studentId, day, month, year, status } = request;

    let isNew = false;
    let attendance = await this.attendanceRepo.findByBatchAndMonth(tenantId, batchId, month, year);

    if (!attendance) {
      attendance = Attendance.create({ tenantId, batchId, month, year });
      isNew = true;
    }

    attendance.markAttendance(studentId, day, status);

    if (isNew) {
      attendance = await this.attendanceRepo.save(attendance);
    } else {
      attendance = await this.attendanceRepo.update(attendance);
    }

    return {
      id: attendance.id,
      batchId: attendance.batchId,
      month: attendance.month,
      year: attendance.year,
      studentId,
      day,
      status,
    };
  }
}
