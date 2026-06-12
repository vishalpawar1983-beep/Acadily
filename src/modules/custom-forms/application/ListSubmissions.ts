import type { UseCase } from '../../../shared/application/UseCase.js';
import type { ICustomFormRepository } from '../domain/repositories/ICustomFormRepository.js';
import type { FormFieldValue } from '../domain/entities/FormSubmission.js';

export interface ListSubmissionsRequest {
  tenantId: string;
  formId: string;
  skip?: number;
  limit?: number;
}

export interface ListSubmissionsResponse {
  submissions: Array<{
    id: string;
    formId: string;
    values: FormFieldValue[];
    addedBy: string;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListSubmissions implements UseCase<ListSubmissionsRequest, ListSubmissionsResponse> {
  constructor(private readonly repo: ICustomFormRepository) {}

  async execute(request: ListSubmissionsRequest): Promise<ListSubmissionsResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { submissions, total } = await this.repo.findSubmissionsByForm(
      request.tenantId,
      request.formId,
      { skip, limit },
    );

    return {
      submissions: submissions.map((s) => ({
        id: s.id,
        formId: s.formId,
        values: s.values,
        addedBy: s.addedBy,
        createdAt: s.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
