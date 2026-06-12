import { describe, it, expect } from '@jest/globals';
import { Tenant } from '../../../src/modules/tenant/domain/entities/Tenant';
import { TenantConfig } from '../../../src/modules/tenant/domain/value-objects/TenantConfig';

describe('TenantConfig value object', () => {
  it('should create with defaults', () => {
    const config = TenantConfig.create({
      receiptPrefix: 'RCT',
      isGstEnabled: false,
    });
    expect(config.receiptPrefix).toBe('RCT');
    expect(config.isGstEnabled).toBe(false);
    expect(config.features).toEqual({});
    expect(config.gstNumber).toBeUndefined();
  });

  it('should check feature flags', () => {
    const config = TenantConfig.create({
      receiptPrefix: 'RCT',
      isGstEnabled: true,
      gstNumber: 'GST123',
      features: { sms: true, whatsapp: false },
    });
    expect(config.isFeatureEnabled('sms')).toBe(true);
    expect(config.isFeatureEnabled('whatsapp')).toBe(false);
    expect(config.isFeatureEnabled('unknown')).toBe(false);
  });

  it('should return a copy of features (immutability)', () => {
    const config = TenantConfig.create({
      receiptPrefix: 'X',
      isGstEnabled: false,
      features: { a: true },
    });
    const features = config.features;
    features.a = false;
    expect(config.isFeatureEnabled('a')).toBe(true);
  });
});

describe('Tenant entity', () => {
  const validInput = {
    tenantId: 'tenant_reliance',
    name: 'Reliance IMS',
    slug: 'reliance',
    email: 'admin@reliance.com',
  };

  it('should create with defaults', () => {
    const tenant = Tenant.create(validInput);
    expect(tenant.tenantId).toBe('tenant_reliance');
    expect(tenant.name).toBe('Reliance IMS');
    expect(tenant.slug).toBe('reliance');
    expect(tenant.isActive).toBe(true);
    expect(tenant.plan).toBe('free');
    expect(tenant.config.receiptPrefix).toBe('');
    expect(tenant.id).toBeDefined();
  });

  it('should create with full config', () => {
    const tenant = Tenant.create({
      ...validInput,
      plan: 'premium',
      config: {
        receiptPrefix: 'REL',
        gstNumber: 'GST999',
        isGstEnabled: true,
      },
    });
    expect(tenant.plan).toBe('premium');
    expect(tenant.config.receiptPrefix).toBe('REL');
    expect(tenant.config.gstNumber).toBe('GST999');
    expect(tenant.config.isGstEnabled).toBe(true);
  });

  it('should update details', () => {
    const tenant = Tenant.create(validInput);
    tenant.updateDetails({ name: 'Updated Name', phone: '9999999999' });

    expect(tenant.name).toBe('Updated Name');
    expect(tenant.phone).toBe('9999999999');
    expect(tenant.email).toBe('admin@reliance.com'); // unchanged
  });

  it('should update config', () => {
    const tenant = Tenant.create(validInput);
    tenant.updateConfig({ receiptPrefix: 'NEW', isGstEnabled: true });

    expect(tenant.config.receiptPrefix).toBe('NEW');
    expect(tenant.config.isGstEnabled).toBe(true);
  });

  it('should update plan', () => {
    const tenant = Tenant.create(validInput);
    tenant.updatePlan('premium');
    expect(tenant.plan).toBe('premium');
  });

  it('should deactivate and activate', () => {
    const tenant = Tenant.create(validInput);
    expect(tenant.isActive).toBe(true);

    tenant.deactivate();
    expect(tenant.isActive).toBe(false);

    tenant.activate();
    expect(tenant.isActive).toBe(true);
  });

  it('should reconstitute from persisted data', () => {
    const now = new Date();
    const tenant = Tenant.reconstitute('id-123', {
      tenantId: 'tenant_x',
      name: 'X Institute',
      slug: 'x-inst',
      email: 'x@test.com',
      config: {
        receiptPrefix: 'X',
        isGstEnabled: false,
        features: {},
      },
      isActive: true,
      plan: 'basic',
      createdAt: now,
      updatedAt: now,
    });

    expect(tenant.id).toBe('id-123');
    expect(tenant.tenantId).toBe('tenant_x');
    expect(tenant.plan).toBe('basic');
  });
});
