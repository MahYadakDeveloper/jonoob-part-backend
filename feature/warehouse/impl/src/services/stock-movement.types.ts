import {
  InboundStockMovement,
  OutboundStockMovement,
} from '@feature/warehouse-api';

export type StockMovement = InboundStockMovement | OutboundStockMovement;

export type AdjustMovementSource = Extract<
  StockMovement['source'],
  { type: 'adjustment' }
>;
