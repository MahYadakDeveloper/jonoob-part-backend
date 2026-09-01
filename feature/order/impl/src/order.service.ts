import { FindManyProductResponse, type CatalogApi } from '@feature/catalog-api';
import {
  LineItems,
  Money,
  SettingToken,
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { type CustomersApi } from '@feature/customer-api';
import { type WalletApi } from '@feature/customer-wallet-api';
import {
  OrderApi,
  OrderCanceledEventType,
  OrderEventPayload,
  OrderRecordedEventType,
} from '@feature/order-api';
import { Delivery } from '@feature/order-delivery-api';
import { type FulfillmentApi } from '@feature/order-fulfillment-api';
import { type PaymentApi } from '@feature/order-payment-api';
import { UnpricedInvoiceItem, type PricingApi } from '@feature/pricing-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { type OrderRepository } from './order.repository';
import { CancellationFee } from './order.type';

@Injectable()
export class OrderService implements OrderApi {
  static readonly OrderSettings: SettingToken<{
    cancellationFee: CancellationFee;
  }> = {
    key: 'order-settings',

    defaultValue: {
      cancellationFee: {
        type: 'fixed',
        amount: {
          value: 0,
          unit: 'toman',
        },
      },
    },

    schema: z.object({
      cancellationFee: z.discriminatedUnion('type', [
        z.object({
          type: z.literal('fixed'),
          amount: z.object({
            value: z.number().nonnegative(),
            unit: z.literal('toman'),
          }),
        }),
        z.object({
          type: z.literal('rate'),
          rate: z.number().min(0).max(100),
        }),
      ]),
    }),
  };

  constructor(
    private readonly repository: OrderRepository,
    private readonly customers: CustomersApi,
    private readonly catalog: CatalogApi,
    private readonly warehouse: WarehouseApi,
    private readonly payment: PaymentApi,
    private readonly pricing: PricingApi,
    private readonly fulfillment: FulfillmentApi,
    private readonly tx: TransactionManager,
    private readonly settings: SettingsStore,
    private readonly outbox: OutboxRepository,
    private readonly wallet: WalletApi,
  ) {}

  async getReservedItems({
    orderId,
  }: {
    orderId: string;
  }): Promise<{ items: LineItems<{ goodId: string; quantity: number }> }> {
    const { stocks } = await this.warehouse.getReservedStocks({ referenceId: orderId });
    return {
      items: stocks,
    };
  }

  // async getOrderSummary({ orderId }: { orderId: any }): Promise<{
  //   summary: InvoiceSummary;
  // }> {
  //   const order = await this.repository.find(orderId);
  //   if (!order) throw new Error();
  //   return {
  //     summary: order.summary,
  //   };
  // }

  async adminCancelOrder({ orderId }: { orderId: string; reason: string }): Promise<void> {
    const order = await this.repository.find(orderId);

    if (!order) throw new Error();

    if (order.status !== 'process')
      throw new Error(
        `Only at process stage can be canceled, the current stage is ${order?.status}`,
      );

    await this.tx.run(async () => {
      await this.payment.refund({
        sessionId: order.payment.sessionId,
        customerId: order.customerId,
      });

      await this.fulfillment.cancel({ orderId: order.id });

      await this.repository.markAs(order.id, 'canceled_by_merchant');
    });
  }

  // async getDeliveryConfirmationCodeOfHandedPackageOver({
  //   orderId,
  // }: {
  //   orderId: string;
  // }): Promise<{ code: string }> {
  //   const order = await this.repository.find(orderId);
  //   if (!order) throw new Error();

  //   if (order.status !== 'out_for_delivery' && order.status !== 'delivered') throw new Error();

  //   if (order.delivery.scope !== 'intra-city') throw new Error('');

  //   return {
  //     code: order.delivery.deliveryConfirmationCode,
  //   };
  // }

  findByCustomerId({ customerId, orderId }: { customerId: string; orderId: string }) {
    return this.repository.findOrderByCustomerId(customerId, orderId);
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
    delivery: Extract<Delivery, { status: 'initiated' }>;
  }) {
    // Check single payment pending order
    const paymentPendingOrders = await this.repository.getPaymentPendingOrders(customerId);
    if (paymentPendingOrders.size) throw new Error(`Customer has none active none settled order`);

    const { customer } = await this.customers.findById({ customerId });
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });

    const reserve = this.calculateReserveStock(items, products);

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

    const { cancellationFee } = await this.settings.get(OrderService.OrderSettings);

    return await this.tx.run(async () => {
      const orderId = await this.repository.create({
        status: 'recorded',
        recordedAt: new Date(),
        customerId,
        items: pricedInvoice.items,
        delivery,
        cancellationTerms: {
          fee: cancellationFee,
        },
        summary: pricedInvoice.summary,
      });

      // Reserve stocks
      await this.warehouse.reserveStock({ referenceId: orderId, items: reserve });

      const { sessionId } = await this.payment.createPaymentSession({
        orderId,
        customer: {
          id: customerId,
          contact: customer,
        },
        amount: pricedInvoice.summary.grandTotal,
        purchasedItems: pricedInvoice.items.transform(
          (item) => ({
            productId: item.productId,
            productName: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }),
          (x) => x.productId,
        ),
      });

      await this.repository.markAsSettlementPending(orderId, sessionId);

      await this.outbox.save({
        type: OrderRecordedEventType,
        payload: { orderId, occurredAt: new Date() } satisfies OrderEventPayload,
      });
    });

    // No return, just redirect client to payment
  }

  /**
   *
   */
  async cancelOrder({ customerId, orderId }: { customerId: string; orderId: string }) {
    const order = await this.repository.findOrderByCustomerId(customerId, orderId);

    if (!order) throw new Error();

    await this.tx.run(async () => {
      switch (order.status) {
        case 'settlement':
          await this.warehouse.releaseStockByRefId({ referenceId: orderId });

          break;
        case 'process':
          await this.payment.refund({
            sessionId: order.payment.sessionId,
            customerId: order.customerId,
          });

          await this.warehouse.releaseStockByRefId({ referenceId: orderId });
          await this.repository.markAs(order.id, 'canceled_by_customer');
          break;
        case 'courier_requested':
          // update order status

          // calculate the cancellation fee and deduct from paid amount
          // and then charge the customer wallet.
          const fee = order.cancellationTerms.fee;
          let refund = Money.zero();
          if (fee.type === 'fixed')
            refund = order.summary.grandTotal.subtract(Money.create(fee.amount.value));
          else {
            refund = order.summary.grandTotal.subtract(order.summary.grandTotal.multiply(fee.rate));
          }

          await this.wallet.deposit({
            amount: refund,
            customerId: customerId,
            reason: 'refund',
            referenceId: orderId,
            idempotencyKey: `order:refunded:${orderId}`,
          });
          break;
        default:
          throw new Error('Not cancelable at this stage');
      }
      await this.repository.markAs(orderId, 'canceled_by_customer');
      await this.outbox.save({
        type: OrderCanceledEventType,
        payload: {
          orderId,
          occurredAt: new Date(),
        } satisfies OrderEventPayload,
      });
    });
  }

  async setSettings({
    newSettings,
  }: {
    newSettings: (typeof OrderService.OrderSettings)['defaultValue'];
  }) {
    await this.settings.set(OrderService.OrderSettings, newSettings);
  }

  calculateReserveStock(
    items: LineItems<{ productId: string; quantity: number }>,
    products: FindManyProductResponse['products'],
  ): LineItems<{ goodId: string; quantity: number }> {
    const reserve = new LineItems<{ goodId: string; quantity: number }>((s) => s.goodId);
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
    return reserve;
  }
}
