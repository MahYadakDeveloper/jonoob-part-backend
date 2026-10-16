import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  DrizzleTransactionContext,
} from '@infra/db-drizzle';
import {
  merchandiseLine,
  orderRelations,
  orders,
  payments,
} from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import type { MerchandiseLine } from '@feature/shared/types/merchandise-line';
import { toMerchandiseLineInsertPlans } from '@feature/shared/mappers/to-merchandise-line.mapper';
import {
  CreateOrderData,
  toOrderInsert,
  toPaymentInsert,
} from './order.mapper';

export class OrderRepository extends DrizzleBaseRepository<
  typeof orderRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof orderRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
    private readonly tx: DrizzleTransactionContext,
  ) {
    super(dbProvider, forUpdateCtx);
  }

  create(
    data: CreateOrderData & { merchandiseLines: MerchandiseLine[] },
  ): Promise<{ id: string }> {
    return this.tx.run(async () => {
      const [order] = await this.db
        .insert(orders)
        .values(toOrderInsert(data))
        .returning({ id: orders.id });
      if (!order) throw new Error('Order insert did not return an ID');

      const plans = toMerchandiseLineInsertPlans(
        { orderId: order.id },
        data.merchandiseLines,
      );

      const insertedRoots = await this.db
        .insert(merchandiseLine)
        .values(
          plans.map((plan) => (plan.kind === 'leaf' ? plan.leaf : plan.bundle)),
        )
        .returning({ id: merchandiseLine.id });
      if (insertedRoots.length !== plans.length) {
        throw new Error('Merchandise line insert did not return all IDs');
      }

      const bundleItemRows = plans.flatMap((plan, index) => {
        if (plan.kind !== 'bundle') return [];

        const bundleId = insertedRoots[index].id;
        return plan.items.map((item) => ({ ...item, bundleId }));
      });

      // Leaf-only orders have no bundle items, and Drizzle rejects an empty values list.
      if (bundleItemRows.length > 0) {
        await this.db.insert(merchandiseLine).values(bundleItemRows);
      }

      // delivery

      // payment
      await this.db.insert(payments).values(toPaymentInsert(order.id));

      return order;
    });
  }

  findByCustomerId(customerId: string): Promise<Order[]> {}

  findById(id: string): Promise<Order | null>;
  findBySessionId(
    sessionId: number,
  ): Promise<Extract<Order, { status: 'settlement' }>>;

  findByCustomerIdWithPaymentPendingStatus(
    customerId: string,
  ): Promise<LineItems<Order>>;

  findOrderHandOverToCourier(
    orderId: string,
  ): Promise<Extract<
    Order,
    { status: 'handed-over-to-courier'; delivery: { scope: 'intra-city' } }
  > | null>;

  markAs(orderId: string, status: Order['status']): Promise<void>;

  // markAsPaid(
  //   id: string,
  //   data: PartialBy<
  //     Extract<Order, { status: 'process' }>,
  //     Extract<
  //       keyof Extract<Order, { status: 'settlement' }>,
  //       keyof Extract<Order, { status: 'process' }>
  //     >
  //   >,
  // ): Promise<void>;
}
