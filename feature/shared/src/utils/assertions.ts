import { timingSafeEqual } from 'node:crypto';

export function assertFirst<T>(
  rows: readonly T[],
  exception: () => Error,
): asserts rows is readonly [T, ...T[]] {
  if (rows.length === 0) {
    throw exception();
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
  exception: () => Error,
): asserts rows is readonly [T] {
  if (rows.length !== 1) {
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

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function ensureOne<T>(
  rows: readonly T[],
  exception: () => Error,
): readonly [T] {
  if (rows.length !== 1) throw exception();
  return rows as readonly [T];
}

export function ensureFound<T>(
  value: T | null | undefined,
  exception: () => Error,
): T {
  if (value == null) {
    throw exception();
  }
  return value;
}
