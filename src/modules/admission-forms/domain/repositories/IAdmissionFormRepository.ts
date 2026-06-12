import type { AdmissionForm } from '../entities/AdmissionForm.js';

export interface IAdmissionFormRepository {
  findById(tenantId: string, id: string): Promise<AdmissionForm | null>;
  findByStudent(tenantId: string, studentId: string): Promise<AdmissionForm | null>;
  save(form: AdmissionForm): Promise<AdmissionForm>;
  update(form: AdmissionForm): Promise<AdmissionForm>;
}
