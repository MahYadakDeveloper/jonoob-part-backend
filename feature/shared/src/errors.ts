/**
 * Naming domain errors:
 *
 * - Name the business condition, not the technical cause or HTTP status
 *   (InsufficientBalanceError, not BadRequestError or PgCheckViolationError).
 * - Format: <Subject><Condition>Error, e.g. MovementNotFoundError,
 *   WalletInsufficientBalanceError. Use "Failure" only for a generic operation
 *   failure with a `reason` param (MovementFailure).
 * - Past-tense or state words read best: NotFound, AlreadyExists, Expired,
 *   Insufficient, Invalid, Forbidden.
 * - The code mirrors the name: MovementNotFoundError -> MOVEMENT_NOT_FOUND.
 * - One class per distinct client behavior; reasons that only differ in detail go
 *   into `params`, not into new classes.
 */
const CODE_CACHE = new WeakMap<object, string>();

export abstract class DomainError extends Error {
  static codeOf(cls: { name: string }): string {
    return cls.name
      .replace(/(Error|Exception)$/, '')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toUpperCase();
  }

  static get code(): string {
    let code = CODE_CACHE.get(this);
    if (!code) {
      code = DomainError.codeOf(this);
      CODE_CACHE.set(this, code);
    }
    return code;
  }

  get code(): string {
    return (this.constructor as typeof DomainError).code;
  }

  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export abstract class NotFoundError extends DomainError {}
export abstract class ConflictError extends DomainError {}
export abstract class ForbiddenError extends DomainError {}
export abstract class BusinessRuleViolationError extends DomainError {}

export abstract class EntityNotFoundError extends NotFoundError {
  static readonly entity: string;

  readonly id?: string | number;
  readonly params: Readonly<Record<string, unknown>>;

  constructor(
    id?: string | number,
    options?: { cause?: unknown; params?: Record<string, unknown> },
  ) {
    const { entity } = new.target as typeof EntityNotFoundError;
    super(
      id === undefined ? `${entity} not found` : `${entity} not found: ${id}`,
      {
        cause: options?.cause,
      },
    );
    this.id = id;
    this.params = { ...(id !== undefined && { id }), ...options?.params };
  }
}
