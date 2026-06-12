import { randomBytes } from 'node:crypto';

function generateObjectIdHex(): string {
  // Generate a 12-byte random value and encode as 24-char hex (MongoDB ObjectId compatible)
  return randomBytes(12).toString('hex');
}

export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this._id = id ?? generateObjectIdHex();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
