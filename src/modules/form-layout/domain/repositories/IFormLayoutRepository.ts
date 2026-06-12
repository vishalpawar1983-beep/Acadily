import type { FormLayout } from '../entities/FormLayout.js';

export interface IFormLayoutRepository {
  findById(tenantId: string, id: string): Promise<FormLayout | null>;
  findByFormAndType(tenantId: string, formId: string, type: 'column' | 'row'): Promise<FormLayout | null>;
  findAllByType(tenantId: string, type: 'column' | 'row'): Promise<FormLayout[]>;
  save(layout: FormLayout): Promise<FormLayout>;
  update(layout: FormLayout): Promise<FormLayout>;
  delete(tenantId: string, id: string): Promise<void>;
}
