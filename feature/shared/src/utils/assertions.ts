import { timingSafeEqual } from 'node:crypto';
import { canonicalize } from './canonical';

/** The error itself, or a factory that builds it lazily from the failure details. */
export type ErrorOrFactory<A extends unknown[] = []> =
  | Error
  | (new () => Error)
  | ((...args: A) => Error);

function resolveError<A extends unknown[]>(
  exception: ErrorOrFactory<A>,
  ...args: A
): Error {
  if (exception instanceof Error) return exception;
  // Arrow functions have no prototype, so this only matches Error classes.
  if (exception.prototype instanceof Error) {
    return new (exception as new () => Error)();
  }
  return (exception as (...args: A) => Error)(...args);
}

export function assertFirst<T>(
  rows: readonly T[],
  exception: ErrorOrFactory,
): asserts rows is readonly [T, ...T[]] {
  if (rows.length === 0) {
    throw resolveError(exception);
  }
}

export function assertNotNull<T>(
  value: T | null | undefined,
  exception: ErrorOrFactory,
): asserts value is T {
  if (value == null) {
    throw resolveError(exception);
  }
}

export function assertFound<T>(
  value: T | null | undefined,
  exception: ErrorOrFactory,
): asserts value is T {
  if (value == null) {
    throw resolveError(exception);
  }
}

export function assertOne<T>(
  rows: readonly T[],
  exception: ErrorOrFactory<[count: number]>,
): asserts rows is readonly [T] {
  if (rows.length !== 1) {
    throw resolveError(exception, rows.length);
  }
}

export function assertLength<T, N extends number>(
  rows: readonly T[],
  expected: N,
  exception: ErrorOrFactory,
): asserts rows is readonly T[] & { readonly length: N } {
  if (rows.length !== expected) {
    throw resolveError(exception);
  }
}

export function assertNotBlank(
  value: string | null | undefined,
  exception: ErrorOrFactory,
): asserts value is string {
  if (value == null || value.trim() === '') throw resolveError(exception);
}

export function assertSafeEqual(
  expected: string,
  actual: string,
  exception: ErrorOrFactory,
): void {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw resolveError(exception);
  }
}

export function assertMaps<K, A, E>(
  actual: Map<K, A>,
  expected: Map<K, E>,
  compare: (actual: A, expected: E, key: K) => boolean,
  exception: ErrorOrFactory<
    [key: K, actual: A | undefined, expected: E | undefined]
  >,
): void {
  for (const [key, exp] of expected) {
    const act = actual.get(key);
    if (act === undefined || !compare(act, exp, key)) {
      throw resolveError(exception, key, act, exp);
    }
  }

  for (const [key, act] of actual) {
    if (!expected.has(key)) throw resolveError(exception, key, act, undefined);
  }
}

export function assertAllExist<T, S>(
  target: readonly T[],
  source: readonly S[],
  keys: {
    target: (item: T) => string;
    source: (item: S) => string;
  },
  exception: ErrorOrFactory<[missing: readonly string[]]>,
): void {
  const existing = new Set(source.map(keys.source));
  const missing = [...new Set(target.map(keys.target))].filter(
    (value) => !existing.has(value),
  );

  if (missing.length > 0) {
    throw resolveError(exception, missing);
  }
}

export function assertString(
  value: unknown,
  exception: ErrorOrFactory,
  {
    minLength = 1,
    maxLength,
    pattern,
    notBlank = false,
  }: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    notBlank?: boolean;
  } = {},
): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length < minLength ||
    (maxLength !== undefined && value.length > maxLength) ||
    (notBlank && value.trim().length === 0) ||
    (pattern !== undefined && !pattern.test(value))
  ) {
    throw resolveError(exception);
  }
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function assertSamePayload<T>(
  existing: T,
  incoming: T,
  exception: ErrorOrFactory,
  normalize: (value: T) => unknown = (value) => value,
): void {
  if (canonicalize(normalize(existing)) !== canonicalize(normalize(incoming))) {
    throw resolveError(exception);
  }
}

export function ensureFirst<T>(
  rows: readonly T[],
  exception: ErrorOrFactory,
): T {
  assertFirst(rows, exception);
  return rows[0];
}

export function ensureOne<T>(rows: readonly T[], exception: ErrorOrFactory): T {
  assertOne(rows, exception);
  return rows[0];
}

export function ensureFound<T>(
  value: T | null | undefined,
  exception: ErrorOrFactory,
): T {
  assertFound(value, exception);
  return value;
}

export function ensureLength<T, N extends number>(
  rows: readonly T[],
  expected: N,
  exception: ErrorOrFactory,
): readonly T[] {
  assertLength(rows, expected, exception);
  return rows;
}
