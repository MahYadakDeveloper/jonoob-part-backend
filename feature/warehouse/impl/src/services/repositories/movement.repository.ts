import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { movements } from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { eq, sql } from 'drizzle-orm';

export class StockMovementRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  findById(id: string) {
    const query = this.db.select().from(movements).limit(1);

    return (this.forUpdate ? query.for('update') : query).then(
      ([row]) => row ?? null,
    );
  }

  findByIdempotencyKey(key: string) {
    const query = this.db
      .select()
      .from(movements)
      .where(eq(movements.idempotencyKey, key))
      .limit(1);

    return (this.forUpdate ? query.for('update') : query).then(
      ([row]) => row ?? null,
    );
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

  async delete(id: string): Promise<void> {
    await this.db.delete(movements).where(eq(movements.id, id));
  }
}
