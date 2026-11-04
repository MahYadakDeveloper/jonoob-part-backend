import { StockNotFoundError } from '@feature/warehouse-api/errors';
import { MovementNotFoundError } from '@feature/warehouse-api/movement';
import { DbErrors, DrizzleBaseRepository, onFk } from '@infra/db-drizzle';
import { quarantines } from '@infra/schema/warehouse/quarantines.schema';
import { sql } from 'drizzle-orm';

type QuarantineItem = typeof quarantines.$inferSelect;

const query = sql`
  UPDATE warehouse.stocks
  SET quantity = quantity + 10
  WHERE id = '550e8400-e29b-41d4-a716-446655440000'
  RETURNING id, quantity;
`;

@DbErrors({
  constraints: {
    ...onFk(
      quarantines,
      'movementId',
      ({ movementId }) => new MovementNotFoundError(movementId),
    ),
    ...onFk(
      quarantines,
      'stockId',
      ({ stockId }) => new StockNotFoundError(stockId),
    ),
  },
})
export class QuarantineRepository extends DrizzleBaseRepository {
  async quarantine(items: QuarantineItem[]) {
    await this.db.insert(quarantines).values(items);
  }
}
