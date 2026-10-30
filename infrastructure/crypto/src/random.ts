import { randomInt } from 'node:crypto';

// randomInt requires (max - min) < 2^48 (~2.8e14), so 14 digits is the safe ceiling.
const MAX_DIGITS = 14;

export function generateNumericCode(length = 6): string {
  if (!Number.isInteger(length) || length < 1 || length > MAX_DIGITS) {
    throw new RangeError(
      `length must be an integer between 1 and ${MAX_DIGITS}`,
    );
  }
  return randomInt(0, 10 ** length)
    .toString()
    .padStart(length, '0');
}
