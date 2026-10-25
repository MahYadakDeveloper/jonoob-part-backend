import { StrictOmit } from '@feature/shared/types/utils';
import { assertLength, ensureOne } from '@feature/shared/utils/assertions';
import {
  movementItems,
  movements,
  quarantines,
} from '@feature/warehouse-schema';
import { DrizzleBaseRepository } from '@infra/db-drizzle';

type RecordMovement = StrictOmit<typeof movements.$inferInsert, 'id'> & {
  items: StrictOmit<typeof movementItems.$inferInsert, 'movementId'>[];
};

type QuarantineItem = typeof quarantines.$inferSelect;

export class MovementRepository extends DrizzleBaseRepository {
  async record(movement: RecordMovement) {
    const inserted = await this.db
      .insert(movements)
      .values(movement)
      .returning({ id: movements.id })
      .then((rows) => ensureOne(rows, () => new CreationFailureError()));

    const insertedItems = await this.db
      .insert(movementItems)
      .values(movement.items.map((i) => ({ movementId: inserted.id, ...i })))
      .returning({ id: movementItems.stockId });

    assertLength(
      insertedItems,
      movement.items.length,
      () => new CreationFailureError(),
    );

    return {
      movementId: inserted.id,
    };
  }

  async quarantine(items: QuarantineItem[]) {
    await this.db.insert(quarantines).values(items);
  }

  // create(movement: RecordMovement): Promise<MovementResult> {
  //   return this.transaction<MovementResult>(async (tx) => {
  //     const [inserted] = await tx
  //       .insert(movements)
  //       .values(movement)
  //       .returning({ id: movements.id });

  //     if (!inserted) {
  //       assertString(movement.idempotencyKey, () => new CreationFailureError());

  //       const rows = await tx
  //         .select()
  //         .from(movements)
  //         .leftJoin(movementItems, eq(movementItems.movementId, movements.id))
  //         .where(eq(movements.idempotencyKey, movement.idempotencyKey));

  //       assertFirst(rows, () => new CreationFailureError());

  //       const existing = toMovementRecord(rows);

  //       assertSamePayload(
  //         movement,
  //         existing,
  //         () => new IdempotencyConflictError(),
  //         ({ direction, source, items }) => ({
  //           direction,
  //           source,
  //           items: unordered(
  //             items.map(({ stockId, quantity }) => ({ stockId, quantity })),
  //           ),
  //         }),
  //       );

  //       return {
  //         movementId: existing.id,
  //         created: false,
  //       };
  //     }

  //     const insertedItems = await tx
  //       .insert(movementItems)
  //       .values(movement.items.map((i) => ({ movementId: inserted.id, ...i })))
  //       .returning({ id: movementItems.stockId });

  //     assertLength(
  //       insertedItems,
  //       movement.items.length,
  //       () => new CreationFailureError(),
  //     );

  //     return {
  //       movementId: inserted.id,
  //       created: true,
  //     };
  //   });
  // }
}

export class CreationFailureError extends Error {}
