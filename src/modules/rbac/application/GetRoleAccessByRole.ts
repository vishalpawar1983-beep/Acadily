import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRoleAccessRepository } from '../domain/repositories/IRoleAccessRepository.js';
import { NotFoundError } from '../../../shared/domain/errors.js';

export interface GetRoleAccessByRoleRequest {
  tenantId: string;
  role: string;
}

export interface GetRoleAccessByRoleResponse {
  id: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetRoleAccessByRole
  implements UseCase<GetRoleAccessByRoleRequest, GetRoleAccessByRoleResponse>
{
  constructor(private readonly roleAccessRepo: IRoleAccessRepository) {}

  async execute(request: GetRoleAccessByRoleRequest): Promise<GetRoleAccessByRoleResponse> {
    const roleAccess = await this.roleAccessRepo.findByRole(request.tenantId, request.role);
    if (!roleAccess) {
      throw new NotFoundError('RoleAccess', request.role);
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
