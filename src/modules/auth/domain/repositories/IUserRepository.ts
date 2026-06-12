import { User } from '../entities/User.js';

export interface IUserRepository {
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(tenantId: string, email: string): Promise<User | null>;
  findByEmailAnyTenant(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(tenantId: string, id: string): Promise<void>;
  findAll(
    tenantId: string,
    options?: { skip?: number; limit?: number; role?: string; excludeRole?: string; search?: string },
  ): Promise<{ users: User[]; total: number }>;
}
