import { DomainError } from '@feature/shared/errors';

/**
 * Common parent of all errors thrown by the warehouse movement module.
 * Lets callers handle any movement failure with a single `instanceof MovementError`
 * check, without matching each concrete error or catching errors from other modules.
 */
export abstract class WarehouseError extends DomainError {}

export class StockNotFoundError extends WarehouseError {
  constructor(readonly stockId?: string) {
    super(stockId ? `Stock ${stockId} not found` : 'Stock not found');
  }
}

export class DuplicateStockError extends WarehouseError {
  constructor(options?: ErrorOptions) {
    super('Duplicate stock in items', options);
  }
}

export class NonPositiveQuantityError extends WarehouseError {
  constructor(options?: ErrorOptions) {
    super('item quantity must be positive', options);
  }
}

export class InsufficientStockError extends WarehouseError {
  constructor(
    readonly stockId?: string,
    readonly requested?: number,
    readonly available?: number,
  ) {
    super(
      stockId === undefined
        ? 'Insufficient stock'
        : `Insufficient stock ${stockId}: requested ${requested}, available ${available}`,
    );
  }
}
