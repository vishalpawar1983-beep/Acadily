import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IFormLayoutRepository } from '../domain/repositories/IFormLayoutRepository.js';
import { FormLayout, type LayoutItem } from '../domain/entities/FormLayout.js';

export interface SaveLayoutRequest {
  tenantId: string;
  formId: string;
  type: 'column' | 'row';
  items: LayoutItem[];
  createdBy: string;
}

export interface SaveLayoutResponse {
  id: string;
  formId: string;
  type: 'column' | 'row';
  items: LayoutItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SaveLayout implements UseCase<SaveLayoutRequest, SaveLayoutResponse> {
  constructor(private readonly repo: IFormLayoutRepository) {}

  async execute(request: SaveLayoutRequest): Promise<SaveLayoutResponse> {
    // Check if a layout already exists for this form + type — if so, update it
    const existing = await this.repo.findByFormAndType(
      request.tenantId,
      request.formId,
      request.type,
    );

    let saved: FormLayout;

    if (existing) {
      existing.updateItems(request.items);
      saved = await this.repo.update(existing);
    } else {
      const layout = FormLayout.create({
        tenantId: request.tenantId,
        formId: request.formId,
        type: request.type,
        items: request.items,
        createdBy: request.createdBy,
      });
      saved = await this.repo.save(layout);
    }

    return {
      id: saved.id,
      formId: saved.formId,
      type: saved.type,
      items: saved.items,
      createdBy: saved.createdBy,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}
