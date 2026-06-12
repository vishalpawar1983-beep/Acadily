import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { TenantConfig } from '../value-objects/TenantConfig.js';

export type PlanType = 'free' | 'basic' | 'premium';

interface TenantProps {
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config: TenantConfig;
  isActive: boolean;
  plan: PlanType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantInput {
  tenantId: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  logo?: string;
  config?: {
    receiptPrefix: string;
    gstNumber?: string;
    isGstEnabled: boolean;
    features?: Record<string, boolean>;
  };
  plan?: PlanType;
}

export class Tenant extends AggregateRoot<TenantProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get email(): string {
    return this.props.email;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get website(): string | undefined {
    return this.props.website;
  }
  get address(): string | undefined {
    return this.props.address;
  }
  get logo(): string | undefined {
    return this.props.logo;
  }
  get config(): TenantConfig {
    return this.props.config;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get plan(): PlanType {
    return this.props.plan;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(details: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    logo?: string;
  }): void {
    if (details.name !== undefined) this.props.name = details.name;
    if (details.email !== undefined) this.props.email = details.email;
    if (details.phone !== undefined) this.props.phone = details.phone;
    if (details.website !== undefined) this.props.website = details.website;
    if (details.address !== undefined) this.props.address = details.address;
    if (details.logo !== undefined) this.props.logo = details.logo;
    this.props.updatedAt = new Date();
  }

  updateConfig(config: {
    receiptPrefix?: string;
    gstNumber?: string;
    isGstEnabled?: boolean;
    features?: Record<string, boolean>;
  }): void {
    this.props.config = TenantConfig.create({
      receiptPrefix: config.receiptPrefix ?? this.props.config.receiptPrefix,
      gstNumber: config.gstNumber ?? this.props.config.gstNumber,
      isGstEnabled: config.isGstEnabled ?? this.props.config.isGstEnabled,
      features: config.features ?? this.props.config.features,
    });
    this.props.updatedAt = new Date();
  }

  updatePlan(plan: PlanType): void {
    this.props.plan = plan;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateTenantInput, id?: string): Tenant {
    return new Tenant(
      {
        tenantId: input.tenantId,
        name: input.name,
        slug: input.slug,
        email: input.email,
        phone: input.phone,
        website: input.website,
        address: input.address,
        logo: input.logo,
        config: TenantConfig.create({
          receiptPrefix: input.config?.receiptPrefix ?? '',
          gstNumber: input.config?.gstNumber,
          isGstEnabled: input.config?.isGstEnabled ?? false,
          features: input.config?.features ?? {},
        }),
        isActive: true,
        plan: input.plan ?? 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    );
  }

  static reconstitute(
    id: string,
    props: {
      tenantId: string;
      name: string;
      slug: string;
      email: string;
      phone?: string;
      website?: string;
      address?: string;
      logo?: string;
      config: {
        receiptPrefix: string;
        gstNumber?: string;
        isGstEnabled: boolean;
        features: Record<string, boolean>;
      };
      isActive: boolean;
      plan: PlanType;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Tenant {
    return new Tenant(
      {
        ...props,
        config: TenantConfig.create(props.config),
      },
      id,
    );
  }
}
