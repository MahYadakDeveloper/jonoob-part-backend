import { type CatalogApi } from '@feature/catalog-api';
import { LineItems, type OutboxRepository, type TransactionManager } from '@feature/common';
import { type CustomersApi } from '@feature/customer-api';
import { OrderEventPayload, OrderPaidEventType } from '@feature/order-api';
import { type PaymentApi } from '@feature/payment-api';
import { type PricingApi } from '@feature/pricing-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { Delivery } from './model/order';
import { type OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly customers: CustomersApi,
    private readonly catalog: CatalogApi,
    private readonly warehouse: WarehouseApi,
    private readonly payment: PaymentApi,
    private readonly pricing: PricingApi,
    private readonly tx: TransactionManager,
    private readonly outbox: OutboxRepository,
  ) {}

  /**
   * [NOTE] Do scope/location validation inside controller
   * Tip: use zod for parsing inside controller
   *
   * [NOTE] The recording order is every time is available but
   * the delivery is warned to customer if is recording at out of
   * business hours and the delivery is going to be delivered in
   * next business hours
   * Example: Order recorded at 3pm on friday and the friday is
   * holiday and store is closed[out of business hours] then the
   * delivery warned to customer the delivery is would be delivered
   * saturday 8:30am witch would be processed and delivered at
   * business hour
   */
  async recordOrder({
    customerId,
    items,
    delivery,
  }: {
    customerId: string;
    items: LineItems<{ productId: string; quantity: number }>;
    delivery: Delivery;
  }) {
    const orderInPaymentStatus = await this.repository.findInPaymentStatus(customerId);
    if (orderInPaymentStatus)
      throw new Error(`Customer has payment required order:${orderInPaymentStatus.orderId}`);

    const { customer } = await this.customers.findById({ customerId });
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });

    const reserve = new LineItems<{ goodId: string; quantity: number }>((s) => s.goodId);

    try {
      for (const item of items) {
        const product = products.getOrThrow(item.productId);
        if (product.kind === 'leaf') {
          const alreadyAdded = reserve.get(item.productId);
          if (alreadyAdded)
            reserve.set({
              goodId: product.goodId,
              quantity: alreadyAdded.quantity + item.quantity,
            });
          else reserve.set({ goodId: product.goodId, quantity: item.quantity });
          continue;
        }

        for (const bundleItem of product.items) {
          const alreadyAdded = reserve.get(bundleItem.productId);
          if (alreadyAdded)
            reserve.set({
              goodId: bundleItem.goodId,
              quantity: alreadyAdded.quantity + bundleItem.quantity * item.quantity,
            });
          else
            reserve.set({
              goodId: bundleItem.goodId,
              quantity: bundleItem.quantity * item.quantity,
            });
        }
      }
    } catch (err) {}

    await this.tx.run(async () => {

      // Resolve pricing
      const pricedItems = await this.pricing...

      // Reserver stocks
      await this.warehouse.reserveStock({ items: reserve });

      const orderId = await this.repository.create({
        status: 'payment',
        paymentStatus: 'pending',
        customer: {
          id: customerId,
          ...customer,
        },
        items: pricedItems,
        delivery,
      });

      await this.payment.createPaymentSession({
        orderId
      })

      // dispatch event after successful record
      await this.outbox.save({
        type: OrderPaidEventType,
        payload: { orderId, occurredAt: new Date() } satisfies OrderEventPayload,
      });
    });
  }

  /**
   *
   */
  async editOrder() {
    //  Dispatch the event because before the state is changed to sending package
    // because the customer can edit and reprocess the package
  }

  /**
   *
   */
  async cancelOrder() {
    // Cancellation only available at processing order period
    // dispatch the event
  }
}
