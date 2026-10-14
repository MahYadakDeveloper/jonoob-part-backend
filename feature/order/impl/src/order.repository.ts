import { DrizzleBaseRepository, DrizzleDbProvider } from '@infra/db-drizzle';
import { orderRelations } from '@infra/db-drizzle/schema';
import { AsyncLocalStorage } from 'async_hooks';
import { Order } from './model/order';

export class OrderRepository extends DrizzleBaseRepository<
  typeof orderRelations
> {
  constructor(
    dbProvider: DrizzleDbProvider<typeof orderRelations>,
    forUpdateCtx: AsyncLocalStorage<'for_update'>,
  ) {
    super(dbProvider, forUpdateCtx);
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

  create(
    data: Omit<
      Extract<Order, { status: 'settlement' }>,
      'id' | 'fulfillment' | 'payment' | 'delivery'
    >,
  ): Promise<string>;

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
