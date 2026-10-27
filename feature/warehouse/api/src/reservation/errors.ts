import {
  MalformedInputError as BaseMalformedInputError,
  DomainError,
} from '@feature/shared/errors';

export abstract class ReservationError extends DomainError {}

/** The same item appears more than once in a collection that must be unique. */
export abstract class DuplicateStockError extends ReservationError {
  constructor(message = 'Duplicate stock in items', options?: ErrorOptions) {
    super(message, options);
  }
}

export abstract class NonPositiveQuantityError extends ReservationError {
  constructor(
    message = 'Item quantity must be positive',
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class MalformedInputError extends BaseMalformedInputError {
  constructor(options?: ErrorOptions) {
    super('Malformed reservation input value', options);
  }
}
