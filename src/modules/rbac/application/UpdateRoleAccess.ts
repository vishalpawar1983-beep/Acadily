import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRoleAccessRepository } from '../domain/repositories/IRoleAccessRepository.js';
import { NotFoundError, ConflictError } from '../../../shared/domain/errors.js';

export interface UpdateRoleAccessRequest {
  tenantId: string;
  roleAccessId: string;
  role?: string;
  permissions?: Record<string, boolean>;
  isActive?: boolean;
}

export interface UpdateRoleAccessResponse {
  id: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  updatedAt: Date;
}

export class UpdateRoleAccess implements UseCase<UpdateRoleAccessRequest, UpdateRoleAccessResponse> {
  constructor(private readonly roleAccessRepo: IRoleAccessRepository) {}

  async execute(request: UpdateRoleAccessRequest): Promise<UpdateRoleAccessResponse> {
    const roleAccess = await this.roleAccessRepo.findById(request.tenantId, request.roleAccessId);
    if (!roleAccess) {
      throw new NotFoundError('RoleAccess', request.roleAccessId);
    }

    if (request.role && request.role !== roleAccess.role) {
      const existing = await this.roleAccessRepo.findByRole(request.tenantId, request.role);
      if (existing) {
        throw new ConflictError(`RoleAccess for role ${request.role} already exists`);
      }
    }

    roleAccess.updateDetails({
      role: request.role,
      permissions: request.permissions,
      isActive: request.isActive,
    });

    const updated = await this.roleAccessRepo.update(roleAccess);

    return {
      id: updated.id,
      role: updated.role,
      permissions: updated.permissions,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }
}
