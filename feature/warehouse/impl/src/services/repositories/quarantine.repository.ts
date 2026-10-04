import { OffsetPagination, PageCriteria, PageResult } from '@feature/common';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import {
  movements,
  quarantines,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq } from 'drizzle-orm';

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OmitPartials<T> = Pick<T, RequiredKeys<T>>;

type StockQuarantine = typeof quarantines.$inferSelect & {
  movement: typeof movements.$inferSelect;
};

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
  ): Promise<PageResult<StockQuarantine, OffsetPagination>> {
    const size = Math.max(1, criteria.page.size);
    const page = Math.max(1, criteria.page.page);

    const offset = (page - 1) * size;

    const [docs, [{ totalItems }]] = await Promise.all([
      this.db.query.quarantines.findMany({
        orderBy: { createdAt: 'desc' },
        offset,
        with: {
          stock: true,
          movement: true,
        },
      }),

      this.db
        .select({
          totalItems: count(),
        })
        .from(quarantines),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    const items = docs.map(
      ({ movementId, movementSourceType, reason, stockId, ...doc }) => {
        doc.stock.doc.movement;
      },
    );

    return {
      page: {
        items,
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async createMany(items: (typeof quarantines.$inferInsert)[]): Promise<void> {
    await this.db.insert(quarantines).values(items);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quarantines).where(eq(quarantines.id, id));
  }
}
