import {
  DrizzleBaseRepository,
  DrizzleDbProvider,
  DrizzleTransactionContext,
} from '@infra/db-drizzle';
import { orderRelations, orders, payments } from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
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

  create(data: CreateOrderData): Promise<{ id: string }> {
    return this.tx.run(async () => {
      const [order] = await this.db
        .insert(orders)
        .values(toOrderInsert(data))
        .returning({ id: orders.id });
      if (!order) throw new Error('Order insert did not return an ID');

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
