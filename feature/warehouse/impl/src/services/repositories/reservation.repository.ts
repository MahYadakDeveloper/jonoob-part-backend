import { OffsetPagination, PageResult } from '@feature/common';
import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  DrizzleTransactionContext,
  orderBy,
  PageCriteria,
} from '@infra/db-drizzle';
import {
  reservationItems,
  reservations,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq } from 'drizzle-orm';

export class StockReservationRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    lockContext: AsyncLocalStorage<'for_update'>,
    private readonly tx: DrizzleTransactionContext,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, lockContext);
  }

  async findById(reservationId: string) {
    if (this.forUpdate) await this.lock('reservations', reservationId);

    return this.db.query.reservations
      .findFirst({
        where: {
          id: reservationId,
        },
        with: {
          items: {
            columns: {
              reservationId: false,
            },
          },
        },
      })
      .then((reservation) => reservation ?? null);
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    if (this.forUpdate) await this.lock('reservations', idempotencyKey);

    return this.db.query.reservations
      .findFirst({
        where: {
          idempotencyKey,
        },
        with: {
          items: {
            columns: {
              reservationId: false,
            },
          },
        },
      })
      .then((reservation) => reservation ?? null);
  }

  async page({
    page,
    size,
    sort,
  }: PageCriteria<typeof reservations>): Promise<
    PageResult<any, OffsetPagination>
  > {
    const offset = (page - 1) * size;

    const [_reservations, [{ totalItems }]] = await Promise.all([
      this.db.query.reservations
        .findMany({
          orderBy: orderBy(sort),
          offset,
          with: {
            items: {
              columns: {
                reservationId: false,
              },
            },
          },
        })
        .then((reservation) => reservation ?? null),
      this.db
        .select({
          totalItems: count(),
        })
        .from(reservations),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: _reservations,
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async create(
    items: Omit<typeof reservationItems.$inferInsert, 'reservationId'>[],
    idempotencyKey: string,
  ): Promise<{ reservationId: string }> {
    return this.tx.run(async () => {
      const [row] = await this.db
        .insert(reservations)
        .values([{ idempotencyKey }])
        .returning({ id: reservations.id });

      await this.db
        .insert(reservationItems)
        .values(items.map((item) => ({ reservationId: row.id, ...item })));

      return {
        reservationId: row.id,
      };
    });
  }

  async delete(reservationId: string): Promise<void> {
    await this.db
      .delete(reservations)
      .where(eq(reservations.id, reservationId));
  }
}
