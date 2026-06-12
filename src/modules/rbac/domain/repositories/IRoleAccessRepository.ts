import type { RoleAccess } from '../entities/RoleAccess.js';

export interface FindAllRoleAccessOptions {
  skip?: number;
  limit?: number;
  isActive?: boolean;
}

export interface IRoleAccessRepository {
  findById(tenantId: string, id: string): Promise<RoleAccess | null>;
  findByRole(tenantId: string, role: string): Promise<RoleAccess | null>;
  findAll(
    tenantId: string,
    options?: FindAllRoleAccessOptions,
  ): Promise<{ roleAccesses: RoleAccess[]; total: number }>;
  save(roleAccess: RoleAccess): Promise<RoleAccess>;
  update(roleAccess: RoleAccess): Promise<RoleAccess>;
}
