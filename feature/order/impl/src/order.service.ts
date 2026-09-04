import { type CatalogApi } from '@feature/catalog-api';
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
import { OrderApi } from '@feature/order-api';
import { Recipient, type DeliveryApi } from '@feature/order-delivery-api';
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
    private readonly delivery: DeliveryApi,
    private readonly tx: TransactionManager,
    private readonly settings: SettingsStore,
    private readonly outbox: OutboxRepository,
    private readonly wallet: WalletApi,
  ) {}

  // async getReservedItems({
  //   orderId,
  // }: {
  //   orderId: string;
  // }): Promise<{ items: LineItems<{ goodId: string; quantity: number }> }> {
  //   const { stocks } = await this.warehouse.getReservedStocks({ referenceId: orderId });
  //   return {
  //     items: stocks,
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
    recipient,
  }: {
    customerId: string;
    items: LineItems<{ productId: string; quantity: number }>;
    recipient: Recipient;
  }) {
    // Check single payment pending order
    const paymentPendingOrders = await this.repository.getPaymentPendingOrders(customerId);
    if (paymentPendingOrders.size) throw new Error(`Customer has none active none settled order`);

    const { customer } = await this.customers.findById({ customerId });
    const { products } = await this.catalog.findMany({ productIds: [...items.keys()] });

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
        status: 'settlement',
        customerId,
        items: pricedInvoice.items,
        cancellationTerms: {
          fee: cancellationFee,
        },
        summary: pricedInvoice.summary,
      });

      // fulfillment
      await this.fulfillment.initialize({ orderId, items });

      // delivery
      await this.delivery.initialize({ orderId, recipient });

      // payment
      await this.payment.initialize({
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
        case 'process':
          await this.payment.refund({
            sessionId: order.payment.sessionId,
            customerId: order.customerId,
          });
          await this.fulfillment.cancel({ orderId });
          await this.delivery.cancelDelivery({ orderId });

          await this.repository.markAs(order.id, 'canceled_by_customer');
          break;
        case 'in_delivery':
          switch (order.delivery.status) {
            case 'courier_requested':
              const fee = order.cancellationTerms.fee;
              let refund = Money.zero();
              if (fee.type === 'fixed')
                refund = order.summary.grandTotal.subtract(Money.create(fee.amount.value));
              else {
                refund = order.summary.grandTotal.subtract(
                  order.summary.grandTotal.multiply(fee.rate),
                );
              }

              // [TODO] make payment refund segmented
              await this.payment.refund({
                amount: refund,
                customerId: customerId,
                reason: 'refund',
                referenceId: orderId,
                idempotencyKey: `order:refunded:${orderId}`,
              });

              await this.delivery.cancelDelivery({ orderId });
              await this.repository.markAs(orderId, 'canceled_by_customer');
              break;
            default:
              throw new Error('Cancel at this stage of delivery is not possible');
          }
          break;
        default:
          throw new Error('Not cancelable at this stage');
      }
    });
  }

  async setSettings({
    newSettings,
  }: {
    newSettings: (typeof OrderService.OrderSettings)['defaultValue'];
  }) {
    await this.settings.set(OrderService.OrderSettings, newSettings);
  }
}
