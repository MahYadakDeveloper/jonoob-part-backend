import {
  BadRequestError,
  BusinessRuleViolationError,
  ConflictError,
  DomainError,
} from '@feature/shared/errors';

export class MovementNotFoundError extends DomainError {
  constructor(readonly movementId?: string) {
    super(
      movementId ? `Movement ${movementId} not found` : 'Movement not found',
    );
  }
}

export class DuplicateStockError extends ConflictError {
  constructor(options?: ErrorOptions) {
    super('Duplicate stock in movement items', options);
  }
}

export class NonPositiveQuantityError extends BadRequestError {
  constructor(options?: ErrorOptions) {
    super('Movement item quantity must be positive', options);
  }
}

export class ReferenceSourceMismatchError extends BusinessRuleViolationError {
  constructor(options?: ErrorOptions) {
    super('Movement reference does not match its source', options);
  }
}

export class MovementNotUndoableError extends BusinessRuleViolationError {
  constructor(
    public readonly movementId: string,
    public readonly source?: string,
  ) {
    // oxlint-disable-next-line no-unused-expressions
    source
      ? super(
          `Movement ${movementId} with source "${source}" cannot be undone.`,
        )
      : super(`Movement ${movementId} cannot be undone.`);
  }
}
