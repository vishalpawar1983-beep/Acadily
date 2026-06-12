import type { TenantSettings } from '../entities/TenantSettings.js';

export interface ITenantSettingsRepository {
  findByTenant(tenantId: string): Promise<TenantSettings | null>;
  save(settings: TenantSettings): Promise<TenantSettings>;
  update(settings: TenantSettings): Promise<TenantSettings>;
}
