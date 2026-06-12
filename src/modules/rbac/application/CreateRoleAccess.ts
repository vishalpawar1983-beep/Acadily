import type { UseCase } from '../../../shared/application/UseCase.js';
import type { IRoleAccessRepository } from '../domain/repositories/IRoleAccessRepository.js';
import { RoleAccess } from '../domain/entities/RoleAccess.js';
import { ConflictError } from '../../../shared/domain/errors.js';

export interface CreateRoleAccessRequest {
  tenantId: string;
  role: string;
  permissions?: Record<string, boolean>;
}

export interface CreateRoleAccessResponse {
  id: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
}

export class CreateRoleAccess implements UseCase<CreateRoleAccessRequest, CreateRoleAccessResponse> {
  constructor(private readonly roleAccessRepo: IRoleAccessRepository) {}

  async execute(request: CreateRoleAccessRequest): Promise<CreateRoleAccessResponse> {
    const existing = await this.roleAccessRepo.findByRole(request.tenantId, request.role);
    if (existing) {
      throw new ConflictError(`RoleAccess for role ${request.role} already exists`);
    }

    const roleAccess = RoleAccess.create({
      tenantId: request.tenantId,
      role: request.role,
      permissions: request.permissions,
    });

    const saved = await this.roleAccessRepo.save(roleAccess);

    return {
      id: saved.id,
      role: saved.role,
      permissions: saved.permissions,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }
}
