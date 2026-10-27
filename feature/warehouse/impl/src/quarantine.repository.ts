import { StockNotFoundError } from '@feature/warehouse-api/errors';
import { MovementNotFoundError } from '@feature/warehouse-api/movement';
import { DbErrors, DrizzleBaseRepository, onFk } from '@infra/db-drizzle';
import { quarantines } from '@infra/schema/warehouse/quarantines.schema';

type QuarantineItem = typeof quarantines.$inferSelect;

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
