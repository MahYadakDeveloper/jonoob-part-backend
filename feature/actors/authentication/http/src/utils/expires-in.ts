import type { JwtSignOptions } from '@nestjs/jwt';
import ms from 'ms'; // needs "esModuleInterop": true, otherwise: import ms = require('ms');

/**
 * Exactly the type Nest / jsonwebtoken accept for `expiresIn` (number | ms.StringValue). Because it is derived from
 * JwtSignOptions, it stays in sync automatically if the library type changes.
 */
export type ExpiresIn = NonNullable<JwtSignOptions['expiresIn']>;

export const secondsUntil = (exp: number, nowMs: number = Date.now()): number =>
  Math.max(0, Math.ceil(exp - nowMs / 1000));

/**
 * Converts an `expiresIn` value to whole seconds, following jsonwebtoken's rules:
 *
 * - number -> seconds (900 => 900s)
 * - string -> parsed by `ms` ("15m" => 900s, "7d" => 604800s) NOTE: a bare numeric string such as "120" means 120
 *   _milliseconds_.
 */
export function expiresInToSeconds(expiresIn: ExpiresIn): number {
  const seconds =
    typeof expiresIn === 'number' ? expiresIn : ms(expiresIn) / 1000;

  // ms() returns undefined for unparsable strings -> NaN here
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new RangeError(`Invalid expiresIn value: ${String(expiresIn)}`);
  }

  // Redis rejects EX 0, and rounding down could make the key expire
  // before the token itself does.
  return Math.ceil(seconds);
}
