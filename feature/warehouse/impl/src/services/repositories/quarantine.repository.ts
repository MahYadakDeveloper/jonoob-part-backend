import type { OmitPartials } from '@/utils';
import { OffsetPagination, PageCriteria, PageResult } from '@feature/common';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
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

type RowInsert = OmitPartials<
  typeof quarantines.$inferSelect & {
    movement: OmitPartials<typeof movements.$inferSelect>;
  }
>;

export class StockQuarantineRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    lockContext: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, lockContext);
  }

  async page(
    criteria: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<Quarantine, OffsetPagination>> {
    const size = Math.max(1, criteria.page.size);
    const page = Math.max(1, criteria.page.page);

    const offset = (page - 1) * size;

    const [_quantities, [{ totalItems }]] = await Promise.all([
      this.db.query.quarantines.findMany({
        orderBy: { createdAt: 'desc' },
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
