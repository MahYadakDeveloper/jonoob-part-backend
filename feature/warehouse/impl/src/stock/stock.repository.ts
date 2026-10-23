import { Barcode } from '@feature/shared/types/barcode';
import { OffsetPagination, PageResult } from '@feature/shared/types/pagination';
import { StrictOmit } from '@feature/shared/types/utils';
import { ensureOne } from '@feature/shared/utils/assertions';
import {
  DrizzleBaseRepository,
  orderBy,
  PageCriteria,
  sortableFields,
  sqlCase,
} from '@infra/db-drizzle';
import {
  reservationItems,
  stocks,
  unitOfMeasure,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { Injectable } from '@nestjs/common';
import { and, count, eq, getColumns, inArray, sql } from 'drizzle-orm';

export type Stock = {
  id: string;
  barcode: Barcode;
  quantity: number;
  unitOfMeasure: (typeof unitOfMeasure.enumValues)[number];
  storageLocation: string | null;
  reservedQuantity: number | null;
};

export type CreateStockData = StrictOmit<Stock, 'id'>;

export const stockSortableFields = sortableFields(stocks);

@Injectable()
export class StockRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  private selectStock() {
    const reservedQuantity = sql<number>`(
      select coalesce(sum(${reservationItems.quantity}), 0)
      from ${reservationItems}
      where ${reservationItems.stockId} = ${stocks.id}}
  )`.mapWith(Number);

    return this.db
      .select({
        ...getColumns(stocks),
        reservedQuantity,
      })
      .from(stocks);
  }

  async findById(id: string): Promise<Stock | undefined> {
    const [row] = await this.applyForUpdateConditionally(
      this.selectStock().where(eq(stocks.id, id)),
      stocks,
    );

    return row && toStock(row);
  }

  async findManyById(ids: string[]): Promise<Stock[]> {
    const rows = await this.applyForUpdateConditionally(
      this.selectStock().where(inArray(stocks.id, ids)),
    );

    return rows.map(toStock);
  }

  async findByBarcode(barcode: Barcode): Promise<Stock | undefined> {
    const [row] = await this.applyForUpdateConditionally(
      this.db
        .select()
        .from(stocks)
        .where(
          and(
            eq(stocks.barcodeType, barcode.type),
            eq(stocks.barcodeValue, barcode.value),
          ),
        ),
    );

    return row && toStock(row);
  }

  async page({
    page,
    size,
    sort,
  }: PageCriteria<typeof stocks>): Promise<
    PageResult<Stock, OffsetPagination>
  > {
    const offset = (page - 1) * size;

    const [stocksRows, [totalItemsRow]] = await Promise.all([
      this.db
        .select()
        .from(stocks)
        .offset(offset)
        .limit(size)
        .orderBy(...orderBy(stocks, sort)),
      this.db
        .select({
          totalItems: count(),
        })
        .from(stocks),
    ]);

    const totalItems = totalItemsRow!.totalItems;
    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: stocksRows.map(toStock),
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

  create({ barcode, ...data }: CreateStockData): Promise<{ id: string }> {
    return this.db
      .insert(stocks)
      .values({
        ...data,
        barcodeType: barcode.type,
        barcodeValue: barcode.value,
      })
      .returning({
        id: stocks.id,
      })
      .then((rows) => ensureOne(rows, () => new Error())[0]);
  }

  async update(id: string, data: Partial<CreateStockData>): Promise<void> {
    const updated = await this.db
      .update(stocks)
      .set(data)
      .where(eq(stocks.id, id))
      .returning({ id: stocks.id });

    ensureOne(updated, () => new Error());
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.db
      .delete(stocks)
      .where(eq(stocks.id, id))
      .returning({ id: stocks.id });

    ensureOne(deleted, () => new Error());
  }
}

function toStock({
  barcodeType,
  barcodeValue,
  ...row
}: typeof stocks.$inferSelect): Stock {
  return {
    ...row,
    barcode: {
      type: barcodeType,
      value: barcodeValue,
    },
  };
}
