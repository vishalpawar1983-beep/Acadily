import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRoleAccessRepository } from '../domain/repositories/IRoleAccessRepository.js';

export interface ListRoleAccessRequest {
  tenantId: string;
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface ListRoleAccessResponse {
  roleAccesses: Array<{
    id: string;
    role: string;
    permissions: Record<string, boolean>;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
  skip: number;
  limit: number;
}

export class ListRoleAccess implements UseCase<ListRoleAccessRequest, ListRoleAccessResponse> {
  constructor(private readonly roleAccessRepo: IRoleAccessRepository) {}

  async execute(request: ListRoleAccessRequest): Promise<ListRoleAccessResponse> {
    const skip = request.skip ?? 0;
    const limit = request.limit ?? 20;

    const { roleAccesses, total } = await this.roleAccessRepo.findAll(request.tenantId, {
      skip,
      limit,
      isActive: request.isActive,
    });

    return {
      roleAccesses: roleAccesses.map((r) => ({
        id: r.id,
        role: r.role,
        permissions: r.permissions,
        isActive: r.isActive,
        createdAt: r.createdAt,
      })),
      total,
      skip,
      limit,
    };
  }
}
