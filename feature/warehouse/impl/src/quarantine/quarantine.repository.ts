import { OffsetPagination, OmitPartials, PageResult } from '@feature/common';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  orderBy,
  PageCriteria,
  sortableFields,
} from '@infra/db-drizzle';
import {
  movements,
  quarantines,
  stocks,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq } from 'drizzle-orm';

type Quarantine = Omit<
  typeof quarantines.$inferSelect,
  'movementId' | 'movementSourceType' | 'stockId'
> & {
  stock: typeof stocks.$inferSelect;
  movement: typeof movements.$inferSelect;
};

export const quarantineSortableFields = sortableFields(quarantines);

export class StockQuarantineRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  async page({
    page,
    size,
    sort,
  }: PageCriteria<typeof quarantines>): Promise<
    PageResult<Quarantine, OffsetPagination>
  > {
    const offset = (page - 1) * size;

    const [_quantities, [{ totalItems }]] = await Promise.all([
      this.db.query.quarantines.findMany({
        orderBy: orderBy(sort),
        offset,
        with: {
          stock: true,
          movement: true,
        },
        columns: {
          movementId: false,
          movementSourceType: false,
          stockId: false,
        },
      }),
      this.db
        .select({
          totalItems: count(),
        })
        .from(quarantines),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: _quantities,
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async createMany(
    items: OmitPartials<typeof quarantines.$inferInsert, 'note'>[],
  ): Promise<void> {
    await this.db.insert(quarantines).values(items);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quarantines).where(eq(quarantines.id, id));
  }
}
