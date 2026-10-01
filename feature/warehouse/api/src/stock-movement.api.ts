import {
  IssueMovementSource,
  ReceiptMovementSource,
  ReturnMovementSource,
  StockItems,
} from './warehouse.type';

export const STOCK_MOVEMENT_API = Symbol('STOCK_MOVEMENT_API');
export interface StockMovementApi {
  issue(
    items: StockItems[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  receipt(
    items: StockItems[],
    source: ReceiptMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  return(
    items: StockItems[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  reverse(movementId: string): Promise<void>;
  // transfer(stocks:{..}[], from: warehouseId, to: WarehouseId)
}
