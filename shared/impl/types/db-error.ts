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

export interface DbErrorRules {
  /** Matched first (most specific). */
  constraints?: Record<string, DbErrorRule>;
  /** Fallback by error kind. */
  kinds?: Partial<Record<DbErrorKind, DbErrorRule>>;
}

// ---------------------------------------------------------------------------
// Port: implemented by the infrastructure layer
// ---------------------------------------------------------------------------

/**
 * Turns a raw driver error into a database-agnostic description.
 * Returns `undefined` when the error is not a database error.
 * This is the only dialect-specific piece (e.g. Postgres SQLSTATE codes).
 */
export type DbErrorClassifier = (error: unknown) => DbErrorInfo | undefined;

let classifier: DbErrorClassifier | undefined;

/**
 * Called once by the infrastructure layer at bootstrap. One dialect per
 * process: a later call replaces the previous classifier.
 */
export function setDbErrorClassifier(impl: DbErrorClassifier): void {
  classifier = impl;
}

function classify(error: unknown): DbErrorInfo | undefined {
  if (!classifier) {
    // Misconfiguration must be loud; the original error stays reachable.
    throw new Error(
      'No DbErrorClassifier registered: call setDbErrorClassifier() from the infrastructure layer.',
      { cause: error },
    );
  }
  return classifier(error);
}

// ---------------------------------------------------------------------------
// Dialect-agnostic mapping logic
// ---------------------------------------------------------------------------

/** Classes extend `Error`; arrow functions have no `prototype`. */
export function buildDbError<I>(rule: DbErrorRule<I>, info: I): Error {
  return rule.prototype instanceof Error
    ? new (rule as new () => Error)()
    : (rule as (info: I) => Error)(info);
}

/** Handled by retrying the whole transaction, never mapped to a domain error. */
const RETRYABLE: ReadonlySet<DbErrorKind> = new Set([
  'serialization',
  'deadlock',
]);

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
