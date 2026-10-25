import { StrictOmit } from '@feature/shared/types/utils';
import { ensureOne } from '@feature/shared/utils/assertions';
import { reservationItems, reservations } from '@feature/warehouse-schema';
import { DrizzleBaseRepository } from '@infra/db-drizzle';
import { eq } from 'drizzle-orm';

type ReserveItem = StrictOmit<
  typeof reservationItems.$inferInsert,
  'reservationId'
>;

export class ReservationRepository extends DrizzleBaseRepository {
  async findReservedItems(reservationId: string) {
    return this.applyForUpdateConditionally(
      this.db
        .select()
        .from(reservationItems)
        .where(eq(reservationItems.reservationId, reservationId)),
    );
  }

  async reserve(items: ReserveItem[]) {
    const { reservationId } = ensureOne(
      await this.db
        .insert(reservations)
        .values({})
        .returning({ reservationId: reservations.id }),
      () => new ReservationFailed(),
    );

    await this.db
      .insert(reservationItems)
      .values(items.map((s) => ({ ...s, reservationId })));

    return {
      reservationId,
    };
  }

  async release(reservationId: string): Promise<void> {
    await this.db
      .delete(reservations)
      .where(eq(reservations.id, reservationId));
  }
}

export class ReservationFailed extends Error {}
