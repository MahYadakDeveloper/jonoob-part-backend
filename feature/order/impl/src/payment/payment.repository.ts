import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { orderRelations, payments } from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { eq } from 'drizzle-orm';

/** Mirrors the `payments_refund_fields` check constraint. */
export type PaymentStatusUpdate =
  | { status: 'pending' | 'failure' | 'expired' | 'paid' }
  | {
      status: 'refunded';
      refundType: 'full';
      refundDestination: 'wallet' | 'gateway' | 'partial';
    }
  | {
      status: 'refunded';
      refundType: 'partial';
      refundDestination: 'wallet';
      refundedAmount: number;
    };

export class PaymentRepository extends DrizzleBaseRepository<
  typeof orderRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof orderRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  findById(id: number) {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .then(([row]) => row ?? null);
  }

  findByOrderId(orderId: string) {
    return this.db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .then(([row]) => row ?? null);
  }

  /**
   * Sets the status together with its matching timestamp, as required by the
   * `payments_paid_timestamp` and `payments_refund_fields` check constraints.
   */
  async updateStatus(id: number, update: PaymentStatusUpdate): Promise<void> {
    const now = new Date();
    const cleared = {
      paidAt: null,
      refundedAt: null,
      refundType: null,
      refundDestination: null,
      refundedAmount: null,
    };

    const values: Partial<typeof payments.$inferInsert> =
      update.status === 'paid'
        ? { ...cleared, status: 'paid', paidAt: now }
        : update.status === 'refunded'
          ? {
              ...cleared,
              status: 'refunded',
              refundedAt: now,
              refundType: update.refundType,
              refundDestination: update.refundDestination,
              refundedAmount:
                update.refundType === 'partial' ? update.refundedAmount : null,
            }
          : { ...cleared, status: update.status };

    await this.db.update(payments).set(values).where(eq(payments.id, id));
  }
}
