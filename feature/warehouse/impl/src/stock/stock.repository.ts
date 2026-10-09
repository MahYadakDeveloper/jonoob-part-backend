import { OffsetPagination, OmitPartials, PageResult } from '@feature/common';
import { Barcode } from '@feature/warehouse-api';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  DrizzleTransactionContext,
  orderBy,
  PageCriteria,
  sortableFields,
  sqlCase,
} from '@infra/db-drizzle';
import {
  barcodes,
  reservationItems,
  stocks,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq, inArray, sql } from 'drizzle-orm';

type StockDefinition = OmitPartials<
  typeof stocks.$inferInsert & {
    barcode: Omit<typeof barcodes.$inferInsert, 'stockId'>;
  },
  'storageLocation'
>;

export type Stock = typeof stocks.$inferSelect & {
  barcode: Omit<typeof barcodes.$inferSelect, 'stockId'>;
  reservedQty: number;
};

export const stockSortableFields = sortableFields(stocks);

@Injectable()
export class StockRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
    private readonly tx: DrizzleTransactionContext,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  async findById(id: string): Promise<Stock | null> {
    if (this.forUpdate) await this.lock('stocks', id);

    return this.db.query.stocks
      .findFirst({
        where: {
          id: id,
        },
        with: {
          barcode: {
            columns: {
              stockId: false,
            },
          },
        },
        extras: {
          reservedQty: (_stocks, { sql }) =>
            sql<number>`coalesce((
              select sum(${reservationItems.quantity})::int
              from ${reservationItems}
              where ${reservationItems.stockId} = ${_stocks.id}
            ), 0)`,
        },
      })
      .then((stock) => stock ?? null);
  }

  findManyById(ids: string[]): Promise<Stock[]> {
    return this.db.query.stocks.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      with: {
        barcode: {
          columns: {
            stockId: false,
          },
        },
      },
      extras: {
        reservedQty: (stocks, { sql }) =>
          sql<number>`coalesce((
              select sum(${reservationItems.quantity})::int
              from ${reservationItems}
              where ${reservationItems.stockId} = ${stocks.id}
            ), 0)`,
      },
    });
  }

  findByBarcode(barcode: Barcode): Promise<Stock | null> {
    return this.db.query.stocks
      .findFirst({
        where: {
          barcode: {
            type: barcode.type,
            value: barcode.value,
          },
        },
        with: {
          barcode: {
            columns: {
              stockId: false,
            },
          },
        },
        extras: {
          reservedQty: (stocks, { sql }) =>
            sql<number>`coalesce((
              select sum(${reservationItems.quantity})::int
              from ${reservationItems}
              where ${reservationItems.stockId} = ${stocks.id}
            ), 0)`,
        },
      })
      .then((stock) => stock ?? null);
  }

  async page({
    page,
    size,
    sort,
  }: PageCriteria<typeof stocks>): Promise<
    PageResult<Stock, OffsetPagination>
  > {
    const offset = (page - 1) * size;

    const [_stocks, [{ totalItems }]] = await Promise.all([
      this.db.query.stocks.findMany({
        orderBy: orderBy(sort),
        offset,
        with: {
          barcode: {
            columns: {
              stockId: false,
            },
          },
        },
        limit: size,
        extras: {
          reservedQty: (stocks, { sql }) =>
            sql<number>`coalesce((
              select sum(${reservationItems.quantity})::int
              from ${reservationItems}
              where ${reservationItems.stockId} = ${stocks.id}
            ), 0)`,
        },
      }),
      this.db
        .select({
          totalItems: count(),
        })
        .from(stocks),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: _stocks,
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async increase(items: { id: string; quantity: number }[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        quantity: sql`${stocks.quantity} + ${sqlCase<number>(
          items.map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ id }) => id),
        ),
      );
  }

  async decrease(items: { id: string; quantity: number }[]): Promise<void> {
    await this.db
      .update(stocks)
      .set({
        quantity: sql`${stocks.quantity} - ${sqlCase<number>(
          items.map((s) => ({
            when: eq(stocks.id, s.id),
            then: sql`${s.quantity}`,
          })),
          sql`0`,
        )}`,
      })
      .where(
        inArray(
          stocks.id,
          items.map(({ id }) => id),
        ),
      );
  }

  available(ids: string[]): Promise<{ id: string; available: boolean }[]> {
    return this.db
      .select({
        id: stocks.id,
        available: sql<boolean>`${stocks.quantity} > 0`,
      })
      .from(stocks)
      .where(inArray(stocks.id, ids));
  }

  define({
    barcode: _barcode,
    ...rest
  }: StockDefinition): Promise<{ id: string }> {
    return this.tx.run(async () => {
      const [row] = await this.db.insert(stocks).values(rest).returning({
        id: stocks.id,
      });

      await this.db.insert(barcodes).values({ ..._barcode, stockId: row.id });

      return row;
    });
  }

  async redefine(
    id: string,
    { barcode: _barcode, ...rest }: StockDefinition,
  ): Promise<void> {
    return this.tx.run(async () => {
      await this.db.update(stocks).set(rest).where(eq(stocks.id, id));

      await this.db
        .update(barcodes)
        .set(_barcode)
        .where(eq(barcodes.stockId, id));
    });
  }

  delete(id: string) {
    return this.db.delete(stocks).where(eq(stocks.id, id));
  }
}
