import {
  IssueMovementSource,
  MovementItem,
  ReceiptMovementSource,
  ReturnMovementSource,
} from './warehouse.type';

export const STOCK_MOVEMENT_API = Symbol('STOCK_MOVEMENT_API');
export interface StockMovementApi {
  issue(
    items: MovementItem[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  receipt(
    items: MovementItem[],
    source: ReceiptMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  return(
    items: MovementItem[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  reverse(
    movementId: string,
    idempotencyKey: string,
  ): Promise<{ reversalMovementId: string }>;
  // transfer(stocks:{..}[], from: warehouseId, to: WarehouseId)
}
