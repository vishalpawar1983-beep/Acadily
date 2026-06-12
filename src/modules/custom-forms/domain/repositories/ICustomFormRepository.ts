import type { FormDefinition } from '../entities/FormDefinition.js';
import type { FormSubmission } from '../entities/FormSubmission.js';
import type { DefaultSelect } from '../entities/DefaultSelect.js';

export interface FindAllFormsOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface FindSubmissionsOptions {
  skip?: number;
  limit?: number;
}

export interface ICustomFormRepository {
  // Forms
  findFormById(tenantId: string, id: string): Promise<FormDefinition | null>;
  findAllForms(
    tenantId: string,
    options?: FindAllFormsOptions,
  ): Promise<{ forms: FormDefinition[]; total: number }>;
  saveForm(form: FormDefinition): Promise<FormDefinition>;
  updateForm(form: FormDefinition): Promise<FormDefinition>;
  deleteForm(tenantId: string, id: string): Promise<void>;

  // Submissions
  findSubmissionById(tenantId: string, id: string): Promise<FormSubmission | null>;
  findSubmissionsByForm(
    tenantId: string,
    formId: string,
    options?: FindSubmissionsOptions,
  ): Promise<{ submissions: FormSubmission[]; total: number }>;
  saveSubmission(submission: FormSubmission): Promise<FormSubmission>;
  updateSubmission(submission: FormSubmission): Promise<FormSubmission>;
  deleteSubmission(tenantId: string, id: string): Promise<void>;

  // Default Selects
  findSelectById(tenantId: string, id: string): Promise<DefaultSelect | null>;
  findAllSelects(
    tenantId: string,
    options?: { skip?: number; limit?: number },
  ): Promise<{ selects: DefaultSelect[]; total: number }>;
  saveSelect(select: DefaultSelect): Promise<DefaultSelect>;
  updateSelect(select: DefaultSelect): Promise<DefaultSelect>;
}
