import { IssueMovementSource } from './warehouse.type';

export const STOCK_RESERVATION_API = Symbol('STOCK_RESERVATION_API');

export interface StockReservationItem {
  stockId: string;
  quantity: number;
}

export interface StockReservationApi {
  /** Reserves stock. `movementSource` is stored and used by `consume`. */
  reserve(input: {
    items: StockReservationItem[];
    idempotencyKey: string;
  }): Promise<{ reservationId: string }>;

  /** Cancels an active reservation. No-op if released; fails if consumed. */
  release(reservationId: string): Promise<void>;
}
