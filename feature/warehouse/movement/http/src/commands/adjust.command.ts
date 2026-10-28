import { Command } from '@feature/shared/cqrs';
import { DiscriminatedUnion, StrictOmit } from '@feature/shared/types/utils';
import { assertNever, assertOne } from '@feature/shared/utils/assertions';
import { StockNotFoundError } from '@feature/warehouse-errors/stock';
import { type Database, InjectDrizzle } from '@infra/db-drizzle';
import {
  adjustmentEffect,
  adjustmentReason,
  adjustments,
} from '@infra/schema/warehouse/adjustments.schema';
import { stocks } from '@infra/schema/warehouse/stocks.schema';
import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

type Reason = (typeof adjustmentReason.enumValues)[number];
type Effect = (typeof adjustmentEffect.enumValues)[number];

type Base = StrictOmit<
  typeof adjustments.$inferInsert,
  'id' | 'adjustedAt' | 'effect' | 'reason' | 'note'
>;

type Note = { note?: string | null };
type With<E extends Effect> = { effect: E } & Note;

export type AdjustmentInput = Base &
  DiscriminatedUnion<
    'reason',
    Reason,
    {
      damaged: With<'shortage'>;
      lost: With<'shortage'>;
      found: With<'surplus'>;
      count_correction: With<Effect>;
      other: { effect: Effect; note: string };
    }
  >;

@Injectable()
export class AdjustMovementCommand implements Command<AdjustmentInput, void> {
  constructor(@InjectDrizzle() private readonly db: Database) {}
  execute(input: AdjustmentInput): void {
    return this.db.transaction(async (tx) => {
      const { effect } = input;
      let op;
      switch (effect) {
        case 'surplus':
          op = '+';
          break;
        case 'shortage':
          op = '-';
          break;
        default:
          assertNever(effect);
      }

      const updated = await tx
        .update(stocks)
        .set({
          quantity: sql`${stocks.quantity} ${sql.raw(op)} ${input.quantity}`,
        })
        .where(eq(stocks.id, input.stockId))
        .returning({ id: stocks.id });

      assertOne(updated, () => new StockNotFoundError(''));

      await tx.insert(adjustments).values(input);
    });
  }
}
