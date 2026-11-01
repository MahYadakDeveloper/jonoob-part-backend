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

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL = LOWER + UPPER + DIGITS;

const pick = (chars: string): string => chars[randomInt(chars.length)]!;

const shuffle = <T>(items: T[]): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
};

export const generatePassword = (length = 8): string => {
  if (length < 3) throw new RangeError('length must be at least 3');

  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(ALL));

  return shuffle(chars).join('');
};
