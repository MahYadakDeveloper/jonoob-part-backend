import { movements } from '../schema/movements.schema';

export function toStockMovement(row: typeof movements.$inferSelect) {
  if (row.data.direction === 'inbound')
    if (row.data.source.type === 'procurement') row.data.source.boundary === '';
}
export function toStockMovementRow() {}
