import { StudentAlert } from '../entities/StudentAlert.js';

export interface IStudentAlertRepository {
  findById(tenantId: string, id: string): Promise<StudentAlert | null>;
  findAll(tenantId: string): Promise<StudentAlert[]>;
  save(alert: StudentAlert): Promise<StudentAlert>;
  update(alert: StudentAlert): Promise<StudentAlert>;
  delete(tenantId: string, id: string): Promise<void>;
}
