import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export const ROLES = [
  'SuperAdmin',
  'Admin',
  'Accounts',
  'Counsellor',
  'Telecaller',
  'Trainer',
  'Student',
] as const;

export type RoleType = (typeof ROLES)[number];

interface RoleProps {
  value: RoleType;
}

export class Role extends ValueObject<RoleProps> {
  get value(): RoleType {
    return this.props.value;
  }

  static create(role: string): Role {
    if (!ROLES.includes(role as RoleType)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${ROLES.join(', ')}`);
    }
    return new Role({ value: role as RoleType });
  }

  isAdmin(): boolean {
    return this.props.value === 'Admin' || this.props.value === 'SuperAdmin';
  }

  isSuperAdmin(): boolean {
    return this.props.value === 'SuperAdmin';
  }
}
