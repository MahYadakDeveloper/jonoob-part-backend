import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { AsyncLocalStorage } from 'async_hooks';

export class StockMovementRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  record(): Promise<{ movementId: string }> {}
}
