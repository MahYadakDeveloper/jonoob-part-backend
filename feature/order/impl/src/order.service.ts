import { type CatalogApi } from '@feature/catalog-api';
import { LineItems, type OutboxRepository, type TransactionManager } from '@feature/common';
import { Customer, type CustomersApi } from '@feature/customer-api';
import { Delivery, OrderApi, OrderEventPayload, OrderRecordedEventType } from '@feature/order-api';
import { type PaymentApi } from '@feature/payment-api';
import { UnpricedInvoiceItem, type PricingApi } from '@feature/pricing-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { Order } from './model/order';
import { type OrderRepository } from './order.repository';

@Injectable()
export class OrderService implements OrderApi {
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

  async getRecipientInformation({ orderId }: { orderId: string }): Promise<{
    customer: { id: string } & Customer;
    delivery: Delivery;
  }> {
    const order = await this.repository.findById(orderId);

    if (!order) throw new Error('Order not found');

    return {
      customer: order.customer,
      delivery: order.delivery,
    };
  }

  async getDeliveryConfirmationCodeOfHandedPackageOver({
    orderId,
  }: {
    orderId: string;
  }): Promise<{ code: string }> {
    const order = await this.repository.findById(orderId);
    if (!order) throw new Error();

    if (order.status !== 'handed-over-to-courier' && order.status !== 'delivered')
      throw new Error();

    if (order.delivery.scope !== 'intra-city') throw new Error('');

    return {
      code: order.delivery.deliveryConfirmationCode,
    };
  }

  async getDeliveryAddress({ orderId }: { orderId: string }): Promise<{
    delivery: Delivery;
  }> {
    const order = await this.repository.findById(orderId);
    if (!order) throw new Error();

    return {
      delivery: order.delivery,
    };
  }

  async findById({ orderId }: { orderId: string }): Promise<{ order: Order }> {
    const order = await this.repository.findById(orderId);
    if (!order) throw new Error('Order not found!');

    return { order };
  }

  findOne(orderId: string) {
    return this.repository.findById(orderId);
  }

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
    const orderInPaymentStatus = await this.repository.findWaitingToSettleOrders(customerId);
    if (orderInPaymentStatus.size) throw new Error(`Customer has none active none settled order`);

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
      const { pricedInvoice } = await this.pricing.priceInvoice({
        items: items.transform<UnpricedInvoiceItem>(
          (item) => {
            const product = products.getOrThrow(item.productId);
            if (product.kind === 'bundle')
              return {
                kind: 'bundle',
                productId: item.productId,
                description: product.displayName,
                quantity: item.quantity,
                items: product.items.toArray().map((_item) => ({
                  description: _item.displayName,
                  kind: 'leaf',
                  productId: _item.productId,
                  quantity: _item.quantity,
                })),
              };

            return {
              kind: 'leaf',
              productId: item.productId,
              description: product.displayName,
              quantity: item.quantity,
            };
          },
          (item) => item.description,
        ),
        customer: { id: customerId, type: customer.type },
      });

      const orderId = await this.repository.create({
        status: 'settlement',
        recordedAt: new Date(),
        customer: {
          id: customerId,
          ...customer,
        },
        items: pricedInvoice.items,
        delivery,
        summary: pricedInvoice.summary,
      });

      // Reserver stocks
      await this.warehouse.reserveStock({ referenceId: orderId, items: reserve });

      await this.payment.createPaymentSession({
        orderId,
        customerId,
      });

      // dispatch event after successful record
      await this.outbox.save({
        type: OrderRecordedEventType,
        payload: { orderId, occurredAt: new Date() } satisfies OrderEventPayload,
      });
    });

    // [NOTE] no return, just redirect the customer to settlement page
    // the payment session is already created, so by navigating to
    // settlement page going to see an active order ready for settlement
  }

  /**
   *
   */
  async cancelOrder() {
    // [TODO] Only cancel at states already safe typed but take different
    // actions for different states like the at processing status have
    // to return their credit to its provider not to wallet
    // dispatch the event
  }
}
