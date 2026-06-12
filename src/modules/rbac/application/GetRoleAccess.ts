import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRoleAccessRepository } from '../domain/repositories/IRoleAccessRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetRoleAccessRequest {
  tenantId: string;
  roleAccessId: string;
}

export interface GetRoleAccessResponse {
  id: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetRoleAccess implements UseCase<GetRoleAccessRequest, GetRoleAccessResponse> {
  constructor(private readonly roleAccessRepo: IRoleAccessRepository) {}

  async execute(request: GetRoleAccessRequest): Promise<GetRoleAccessResponse> {
    const roleAccess = await this.roleAccessRepo.findById(request.tenantId, request.roleAccessId);
    if (!roleAccess) {
      throw new NotFoundError('RoleAccess', request.roleAccessId);
    }

    return {
      id: roleAccess.id,
      role: roleAccess.role,
      permissions: roleAccess.permissions,
      isActive: roleAccess.isActive,
      createdAt: roleAccess.createdAt,
      updatedAt: roleAccess.updatedAt,
    };
  }
}
