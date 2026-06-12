import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';

interface RoleAccessProps {
  tenantId: string;
  role: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleAccessInput {
  tenantId: string;
  role: string;
  permissions?: Record<string, boolean>;
}

export class RoleAccess extends AggregateRoot<RoleAccessProps> {
  get tenantId(): string {
    return this.props.tenantId;
  }
  get role(): string {
    return this.props.role;
  }
  get permissions(): Record<string, boolean> {
    return this.props.permissions;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateDetails(input: {
    role?: string;
    permissions?: Record<string, boolean>;
    isActive?: boolean;
  }): void {
    if (input.role !== undefined) this.props.role = input.role;
    if (input.permissions !== undefined) this.props.permissions = input.permissions;
    if (input.isActive !== undefined) this.props.isActive = input.isActive;
    this.props.updatedAt = new Date();
  }

  static create(input: CreateRoleAccessInput, id?: string): RoleAccess {
    return new RoleAccess(
      {
        tenantId: input.tenantId,
        role: input.role,
        permissions: input.permissions ?? {},
        isActive: true,
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
      role: string;
      permissions: Record<string, boolean>;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ): RoleAccess {
    return new RoleAccess(props, id);
  }
}
