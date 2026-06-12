import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFormLayoutRepository } from '../domain/repositories/IFormLayoutRepository.js';
import type { LayoutItem } from '../domain/entities/FormLayout.js';

export interface GetLayoutRequest {
  tenantId: string;
  formId?: string;
  type: 'column' | 'row';
}

export type LayoutDTO = {
  id: string;
  formId: string;
  type: 'column' | 'row';
  items: LayoutItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type GetLayoutResponse = LayoutDTO | LayoutDTO[] | null;

export class GetLayout implements UseCase<GetLayoutRequest, GetLayoutResponse> {
  constructor(private readonly repo: IFormLayoutRepository) {}

  async execute(request: GetLayoutRequest): Promise<GetLayoutResponse> {
    // When formId is not provided, return all layouts of this type for the tenant
    if (!request.formId) {
      const layouts = await this.repo.findAllByType(
        request.tenantId,
        request.type,
      );
      return layouts.map((layout) => ({
        id: layout.id,
        formId: layout.formId,
        type: layout.type,
        items: layout.items,
        createdBy: layout.createdBy,
        createdAt: layout.createdAt,
        updatedAt: layout.updatedAt,
      }));
    }

    const layout = await this.repo.findByFormAndType(
      request.tenantId,
      request.formId,
      request.type,
    );

    if (!layout) return null;

    return {
      id: layout.id,
      formId: layout.formId,
      type: layout.type,
      items: layout.items,
      createdBy: layout.createdBy,
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    };
  }
}
