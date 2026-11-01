import { BusinessRuleViolationError } from '@feature/shared/errors';

interface InsufficientStockDetails {
  stockId?: string;
  requestedQty?: number;
  availableQty?: number;
}

export class InsufficientStockError extends BusinessRuleViolationError {
  readonly stockId?: string;
  readonly requestedQty?: number;
  readonly availableQty?: number;

  constructor({
    stockId,
    requestedQty,
    availableQty,
  }: InsufficientStockDetails = {}) {
    const quantities =
      requestedQty !== undefined && availableQty !== undefined
        ? `: requested ${requestedQty}, available ${availableQty}`
        : '';

    super(`Insufficient stock${stockId ? ` for ${stockId}` : ''}${quantities}`);

    this.stockId = stockId;
    this.requestedQty = requestedQty;
    this.availableQty = availableQty;
  }
}
