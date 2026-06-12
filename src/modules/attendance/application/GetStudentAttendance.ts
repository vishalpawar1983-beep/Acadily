import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IAttendanceRepository } from '../domain/repositories/IAttendanceRepository.js';
import type { AttendanceStatus } from '../domain/entities/Attendance.js';

export interface GetStudentAttendanceRequest {
  tenantId: string;
  studentId: string;
  month?: number;
  year?: number;
}

export interface StudentMonthAttendance {
  attendanceId: string;
  batchId: string;
  month: number;
  year: number;
  days: Record<string, AttendanceStatus>;
}

export interface GetStudentAttendanceResponse {
  studentId: string;
  attendance: StudentMonthAttendance[];
}

export class GetStudentAttendance
  implements UseCase<GetStudentAttendanceRequest, GetStudentAttendanceResponse>
{
  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  async execute(request: GetStudentAttendanceRequest): Promise<GetStudentAttendanceResponse> {
    const { tenantId, studentId, month, year } = request;

    const records = await this.attendanceRepo.findByStudent(tenantId, studentId, { month, year });

    const attendance: StudentMonthAttendance[] = records
      .map((record) => {
        const studentRecord = record.getStudentAttendance(studentId);
        if (!studentRecord) return null;
        return {
          attendanceId: record.id,
          batchId: record.batchId,
          month: record.month,
          year: record.year,
          days: { ...studentRecord.days },
        };
      })
      .filter((item): item is StudentMonthAttendance => item !== null);

    return {
      studentId,
      attendance,
    };
  }
}
