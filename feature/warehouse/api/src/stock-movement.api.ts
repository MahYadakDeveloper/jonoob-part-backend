import { StockMovement } from './warehouse.type';

export interface StockMovementApi {
  issue(stocks: { id: string; quantity: number }[]): Promise<StockMovement>;
  receipt(stocks: { id: string; quantity: number }[]): Promise<StockMovement>;
  return(stocks: { id: string; quantity: number }[]): Promise<StockMovement>;
  reverse(movementId: string): Promise<void>;
  // transfer(stocks:{..}[], from: warehouseId, to: WarehouseId)
}
