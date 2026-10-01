import {
  IssueMovementSource,
  ReceiptMovementSource,
  ReturnMovementSource,
  StockMovementItem,
} from './warehouse.type';

export const STOCK_MOVEMENT_API = Symbol('STOCK_MOVEMENT_API');
export interface StockMovementApi {
  issue(
    stocks: StockMovementItem[],
    source: IssueMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  receipt(
    stocks: StockMovementItem[],
    source: ReceiptMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  return(
    stocks: StockMovementItem[],
    source: ReturnMovementSource,
    idempotencyKey: string,
  ): Promise<{ movementId: string }>;

  reverse(movementId: string): Promise<void>;
  // transfer(stocks:{..}[], from: warehouseId, to: WarehouseId)
}
