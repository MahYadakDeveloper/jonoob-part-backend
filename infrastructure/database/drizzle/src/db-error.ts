import { classifyPgError } from './pg/pg-error';

/** Database-agnostic failure categories. Dialect adapters map their own codes onto these. */
export type DbErrorKind =
  | 'unique'
  | 'foreignKey'
  | 'check'
  | 'notNull'
  | 'invalidInput'
  | 'outOfRange'
  | 'exclusion'
  | 'serialization'
  | 'deadlock'
  | 'lockTimeout';

export interface DbErrorInfo {
  kind?: DbErrorKind | undefined;
  constraint?: string | undefined;
  table?: string | undefined;
  /** Column -> value parsed from the error detail. Best effort. */
  keys: Readonly<Record<string, string>>;
}

export type DbErrorFactory = (info: DbErrorInfo) => Error;

/** A factory, or an error class constructible without arguments. */
export type DbErrorRule<I = DbErrorInfo> =
  | ((info: I) => Error)
  | (new () => Error);

/** Classes extend `Error`; arrow functions have no `prototype`. */
export function buildDbError<I>(rule: DbErrorRule<I>, info: I): Error {
  return rule.prototype instanceof Error
    ? new (rule as new () => Error)()
    : (rule as (info: I) => Error)(info);
}

export interface DbErrorRules {
  /** Matched first (most specific). */
  constraints?: Record<string, DbErrorRule>;
  /** Fallback by error kind. */
  kinds?: Partial<Record<DbErrorKind, DbErrorRule>>;
}

/** Dialect switch: the only line to change for another database. */
const classify = classifyPgError;

/** Handled by retrying the whole transaction, never mapped to a domain error. */
const RETRYABLE: ReadonlySet<DbErrorKind> = new Set(['serialization', 'deadlock']);

export function isRetryableDbError(error: unknown): boolean {
  const kind = classify(error)?.kind;
  return kind !== undefined && RETRYABLE.has(kind);
}

export function mapDbError(error: unknown, rules: DbErrorRules): unknown {
  const info = classify(error);
  if (!info || (info.kind && RETRYABLE.has(info.kind))) return error;

  const factory =
    (info.constraint && rules.constraints?.[info.constraint]) ||
    (info.kind && rules.kinds?.[info.kind]);
  if (!factory) return error;
  const mapped = buildDbError(factory, info);
  mapped.cause ??= error;
  return mapped;
}

/**
 * Maps database errors of every own method that returns a native Promise (i.e. `async` methods).
 * Sync methods and methods returning a Drizzle query builder are left untouched.
 */
export function DbErrors(rules: DbErrorRules): ClassDecorator {
  return (target) => {
    const proto = target.prototype as object;
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      const original: unknown = descriptor?.value;
      if (!descriptor || typeof original !== 'function') continue;

      descriptor.value = function (this: unknown, ...args: unknown[]) {
        const result: unknown = original.apply(this, args);
        if (!(result instanceof Promise)) return result;
        return result.catch((e: unknown) => {
          throw mapDbError(e, rules);
        });
      };
      Object.defineProperty(proto, key, descriptor);
    }
  };
}
