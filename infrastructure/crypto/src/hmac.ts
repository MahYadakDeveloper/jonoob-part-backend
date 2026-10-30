import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * HMAC-SHA256 over an ordered list of string parts. Parts are JSON-encoded, so ("a:b","c") and ("a","b:c") never
 * collide.
 */
export function hmacSha256(
  secret: string | Buffer,
  ...parts: readonly string[]
): Buffer {
  return createHmac('sha256', secret).update(JSON.stringify(parts)).digest();
}

/** Constant-time comparison; returns false (never throws) on length mismatch. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}
