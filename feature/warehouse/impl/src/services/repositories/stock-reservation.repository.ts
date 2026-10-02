import { StockReservationItem } from '@feature/warehouse-api';
import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { AsyncLocalStorage } from 'async_hooks';
import { eq } from 'drizzle-orm';
import { reservationItems, reservations } from './schema/reservations.schema';

export class StockReservationRepository extends DrizzleBaseRepository {
  constructor(
    dbProvider: DrizzleDbProvider,
    lockContext: AsyncLocalStorage<'for_update'>,
    // private readonly cache: StockCache,
  ) {
    super(dbProvider, lockContext);
  }

  async findById(reservationId: string) {
    const query = this.db
      .select()
      .from(reservations)
      .innerJoin(
        reservationItems,
        eq(reservations.id, reservationItems.reservationId),
      )
      .where(eq(reservations.id, reservationId));

    const rows = await (this.forUpdate ? query.for('update') : query);

    if (rows.length === 0) return null;

    return {
      ...rows[0].reservations,
      items: rows.flatMap(({ reservation_items }) => ({
        stockId: reservation_items.stockId,
        quantity: reservation_items.quantity,
      })),
    };
  }

  async findByIdempotencyKey(idempotencyKey: string) {
    const query = this.db
      .select()
      .from(reservations)
      .innerJoin(
        reservationItems,
        eq(reservations.id, reservationItems.reservationId),
      )
      .where(eq(reservations.idempotencyKey, idempotencyKey));

    const rows = await (this.forUpdate ? query.for('update') : query);

    if (rows.length === 0) return null;

    return {
      ...rows[0].reservations,
      items: rows.flatMap(({ reservation_items }) => ({
        stockId: reservation_items.stockId,
        quantity: reservation_items.quantity,
      })),
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
}
