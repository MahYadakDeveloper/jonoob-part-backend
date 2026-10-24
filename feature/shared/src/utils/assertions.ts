import { timingSafeEqual } from 'node:crypto';
import { canonicalize } from './canonical';

export function assertFirst<T>(
  rows: readonly T[],
  exception: () => Error,
): asserts rows is readonly [T, ...T[]] {
  if (rows.length === 0) {
    throw exception();
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  exception: () => Error,
): asserts value is T {
  if (value == null) {
    throw exception();
  }
}

export function assertOne<T>(
  rows: readonly T[],
  exception: (count: number) => Error,
): asserts rows is readonly [T] {
  if (rows.length !== 1) {
    throw exception(rows.length);
  }
}

export function assertLength<T, N extends number>(
  rows: readonly T[],
  expected: N,
  exception: () => Error,
): asserts rows is readonly T[] & { readonly length: N } {
  if (rows.length !== expected) {
    throw exception();
  }
}

export function assertNotBlank(
  value: string | null | undefined,
  exception: () => Error,
): asserts value is string {
  if (value == null || value.trim() === '') throw exception();
}

export function assertSafeEqual(
  expected: string,
  actual: string,
  exception: () => Error,
): void {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw exception();
  }
}

export function assertAllExist<T, S>(
  target: readonly T[],
  source: readonly S[],
  keys: {
    target: (item: T) => string;
    source: (item: S) => string;
  },
  exception: (missing: readonly string[]) => Error,
): void {
  const existing = new Set(source.map(keys.source));
  const missing = [...new Set(target.map(keys.target))].filter(
    (value) => !existing.has(value),
  );

  if (missing.length > 0) {
    throw exception(missing);
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function assertSamePayload<T>(
  existing: T,
  incoming: T,
  exception: () => Error,
  normalize: (value: T) => unknown = (value) => value,
): void {
  if (canonicalize(normalize(existing)) !== canonicalize(normalize(incoming))) {
    throw exception();
  }
}

export function ensureFirst<T>(rows: readonly T[], exception: () => Error): T {
  assertFirst(rows, exception);
  return rows[0];
}

export function ensureOne<T>(rows: readonly T[], exception: () => Error): T {
  assertOne(rows, exception);
  return rows[0];
}

export function ensureFound<T>(
  value: T | null | undefined,
  exception: () => Error,
): T {
  assertFound(value, exception);
  return value;
}

export function ensureLength<T, N extends number>(
  rows: readonly T[],
  expected: N,
  exception: () => Error,
): readonly T[] {
  assertLength(rows, expected, exception);
  return rows;
}
