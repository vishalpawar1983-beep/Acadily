import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IAttendanceRepository } from '../domain/repositories/IAttendanceRepository.js';
import type { StudentRecord } from '../domain/entities/Attendance.js';

export interface GetBatchAttendanceRequest {
  tenantId: string;
  batchId: string;
  month: number;
  year: number;
}

export interface GetBatchAttendanceResponse {
  id: string;
  batchId: string;
  month: number;
  year: number;
  records: ReadonlyArray<StudentRecord>;
}

export class GetBatchAttendance
  implements UseCase<GetBatchAttendanceRequest, GetBatchAttendanceResponse | null>
{
  constructor(private readonly attendanceRepo: IAttendanceRepository) {}

  async execute(request: GetBatchAttendanceRequest): Promise<GetBatchAttendanceResponse | null> {
    const { tenantId, batchId, month, year } = request;

    const attendance = await this.attendanceRepo.findByBatchAndMonth(tenantId, batchId, month, year);
    if (!attendance) return null;

    return {
      id: attendance.id,
      batchId: attendance.batchId,
      month: attendance.month,
      year: attendance.year,
      records: attendance.records,
    };
  }
}
