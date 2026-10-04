import { OffsetPagination, PageCriteria, PageResult } from '@feature/common';
import { StockReservationItem } from '@feature/warehouse-api';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import {
  reservationItems,
  reservations,
  warehouseRelations,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { count, eq } from 'drizzle-orm';

type ReservationRow = typeof reservations.$inferSelect & {
  items: (typeof reservationItems.$inferSelect)[];
};
type Reservation = typeof reservations.$inferSelect & {
  items: Omit<typeof reservationItems.$inferSelect, 'reservationId'>[];
};

export class StockReservationRepository extends DrizzleBaseRepository<
  typeof warehouseRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof warehouseRelations>,
    lockContext: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, lockContext);
  }

  async findById(reservationId: string) {
    if (this.forUpdate) await this.lock('reservations', reservationId);

    const reservation = await this.db.query.reservations.findFirst({
      where: {
        id: reservationId,
      },
      with: {
        items: true,
      },
    });

    return reservation ? this.toModel(reservation) : null;
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    if (this.forUpdate) await this.lock('reservations', idempotencyKey);

    const reservation = await this.db.query.reservations.findFirst({
      where: {
        idempotencyKey,
      },
      with: {
        items: true,
      },
    });

    return reservation ? this.toModel(reservation) : null;
  }

  async page(
    criteria: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<Reservation, OffsetPagination>> {
    const size = Math.max(1, criteria.page.size);
    const page = Math.max(1, criteria.page.page);

    const offset = (page - 1) * size;

    const [rows, [{ totalItems }]] = await Promise.all([
      this.db.query.reservations.findMany({
        orderBy: { createdAt: 'desc' },
        offset,
        with: {
          items: true,
        },
      }),
      this.db
        .select({
          totalItems: count(),
        })
        .from(reservations),
    ]);

    const totalPages = Math.ceil(totalItems / size);

    return {
      page: {
        items: rows.map((row) => this.toModel(row)),
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
    items: StockReservationItem[],
    idempotencyKey: string,
  ): Promise<{ reservationId: string }> {
    const [reservation] = await this.db
      .insert(reservations)
      .values([{ idempotencyKey }])
      .returning({ id: reservations.id });

    await this.db
      .insert(reservationItems)
      .values(
        items.map((item) => ({ reservationId: reservation.id, ...item })),
      );

    return {
      reservationId: reservation.id,
    };
  }

  async delete(reservationId: string): Promise<void> {
    await this.db
      .delete(reservations)
      .where(eq(reservations.id, reservationId));
  }

  private toModel(row: ReservationRow) {
    return {
      ...row,
      items: row.items.map(({ stockId, quantity }) => ({ stockId, quantity })),
    };
  }
}
