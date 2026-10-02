import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import { eq, sql } from 'drizzle-orm';
import { movements } from './schema/movements.schema';

export class StockMovementRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  findById(id: string) {
    return this.db
      .select()
      .from(movements)
      .limit(1)
      .then(([row]) => row ?? null);
  }

  findByIdempotencyKey(key: string) {
    return this.db
      .select()
      .from(movements)
      .where(eq(movements.idempotencyKey, key))
      .limit(1)
      .then(([row]) => row ?? null);
  }

  findByReversesId(reversesId: string) {
    return this.db
      .select({ id: movements.id })
      .from(movements)
      .where(eq(movements.reversesId, reversesId))
      .limit(1)
      .then(([row]) => row ?? null);
  }

  record(data: typeof movements.$inferInsert): Promise<{ movementId: string }> {
    return this.db
      .insert(movements)
      .values(data)
      .onConflictDoUpdate({
        target: movements.idempotencyKey,
        set: {
          idempotencyKey: sql`excluded.idempotency_key`,
        },
      })
      .returning({ movementId: movements.id })
      .then(([row]) => row);
  }

  reverse(movementId: string) {
    return this.db.select({}).from(movements);
  }
}
