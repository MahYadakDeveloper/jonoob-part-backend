export const STOCK_RESERVATION_API = Symbol('STOCK_RESERVATION_API');

export interface StockReservationItem {
  stockId: string;
  quantity: number;
}

export interface ReserveStocksInput {
  idempotencyKey: string;

  items: StockReservationItem[];
}

export interface StockReservationApi {
  /** Reserves stock. `movementSource` is stored and used by `consume`. */
  reserve(input: ReserveStocksInput): Promise<{ reservationId: string }>;

  /** Cancels an active reservation. No-op if released; fails if consumed. */
  release(input: { reservationId: string }): Promise<void>;
}
