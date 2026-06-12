import { createHash, timingSafeEqual } from 'node:crypto';

/** Hash a token (e.g., refresh token) for secure storage */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Timing-safe comparison of a raw token against a stored hash */
export function compareTokenHash(rawToken: string, storedHash: string): boolean {
  const hash = hashToken(rawToken);
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}
