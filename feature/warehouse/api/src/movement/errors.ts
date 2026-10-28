import { DomainError } from '@feature/shared/errors';
import { movements } from '@infra/schema/warehouse/movements.schema';

/**
 * Common parent of all errors thrown by the warehouse movement module.
 * Lets callers handle any movement failure with a single `instanceof MovementError`
 * check, without matching each concrete error or catching errors from other modules.
 */
export abstract class MovementError extends DomainError {}

export class MovementNotFoundError extends MovementError {
  constructor(readonly movementId?: string) {
    super(
      movementId ? `Movement ${movementId} not found` : 'Movement not found',
    );
  }
}

export class DuplicateStockError extends BaseDuplicateStockError {
  constructor(options?: ErrorOptions) {
    super('Duplicate stock in movement items', options);
  }
}

export class NonPositiveQuantityError extends BaseNonPositiveQuantityError {
  constructor(options?: ErrorOptions) {
    super('Movement item quantity must be positive', options);
  }
}

export class ReferenceSourceMismatchError extends MovementError {
  constructor(options?: ErrorOptions) {
    super('Movement reference does not match its source', options);
  }
}

export class MovementNotUndoableError extends Error {
  constructor(
    public readonly movementId: string,
    public readonly source?: (typeof movements.source.enumValues)[number],
  ) {
    source
      ? super(
          `Movement ${movementId} with source "${source}" cannot be undone.`,
        )
      : super(`Movement ${movementId} cannot be undone.`);
  }
}
