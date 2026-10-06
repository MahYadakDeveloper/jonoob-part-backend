import { OmitPartials } from '@/utils';
import { OffsetPagination, PageCriteria, PageResult } from '@feature/common';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { movements, warehouseRelations } from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq, sql } from 'drizzle-orm';

type Movement = Omit<typeof movements.$inferSelect, 'sourceType'>;

export class StockMovementRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  async findById(id: string): Promise<Movement | null> {
    if (this.forUpdate) await this.lock('movements', id);
    return this.db.query.movements
      .findFirst({
        where: {
          id,
        },
        columns: {
          sourceType: false,
        },
      })
      .then((movement) => movement ?? null);
  }

  async findByIdempotencyKey(key: string): Promise<Movement | null> {
    if (this.forUpdate) await this.lock('movements', key);

    return this.db.query.movements
      .findFirst({
        where: {
          idempotencyKey: key,
        },
        columns: {
          sourceType: false,
        },
      })
      .then((movement) => movement ?? null);
  }

  async page(
    criteria: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<Movement, OffsetPagination>> {
    const size = Math.max(1, criteria.page.size);
    const page = Math.max(1, criteria.page.page);

    const offset = (page - 1) * size;

    const [_movements, [{ totalItems }]] = await Promise.all([
      this.db.query.movements.findMany({
        orderBy: { recordedAt: 'desc' },
        offset,
        columns: {
          sourceType: false,
        },
      }),
      this.db
        .select({
          totalItems: count(),
        })
        .from(movements),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: _movements,
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  record(
    movement: OmitPartials<typeof movements.$inferInsert>,
  ): Promise<{ movementId: string }> {
    return this.db
      .insert(movements)
      .values(movement)
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
