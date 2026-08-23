import { type CatalogApi } from '@feature/catalog-api';
import {
  LineItems,
  Money,
  SettingToken,
  type OutboxRepository,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { Customer, type CustomersApi } from '@feature/customer-api';
import { Delivery, OrderApi } from '@feature/order-api';
import { type PaymentApi } from '@feature/payment-api';
import { UnpricedInvoiceItem, type PricingApi } from '@feature/pricing-api';
import { type WalletApi } from '@feature/wallet-api';
import { type WarehouseApi } from '@feature/warehouse-api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Order } from './model/order';
import { OrderCreate, type OrderRepository } from './order.repository';

@Injectable()
export class OrderService implements OrderApi {
  static readonly OrderSettings: SettingToken<{
    cancellationFee:
      | {
          type: 'fixed';
          amount: {
            value: number;
            unit: 'toman';
          };
        }
      | {
          type: 'rate';
          rate: number;
        };
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
    private readonly wallet: WalletApi,
    private readonly payment: PaymentApi,
    private readonly pricing: PricingApi,
    private readonly tx: TransactionManager,
    private readonly settings: SettingsStore,
    private readonly outbox: OutboxRepository,
  ) {}

  async getRecipientInformation({ orderId }: { orderId: string }): Promise<{
    customer: { id: string } & Customer;
    delivery: Delivery;
  }> {
    const order = await this.repository.find(orderId);

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
    const order = await this.repository.find(orderId);
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
    const order = await this.repository.find(orderId);
    if (!order) throw new Error();

    return {
      delivery: order.delivery,
    };
  }

  async findById({ orderId }: { orderId: string }): Promise<{ order: Order }> {
    const order = await this.repository.find(orderId);
    if (!order) throw new Error('Order not found!');

    return { order };
  }

  findOneByCustomerId({ customerId, orderId }: { customerId: string; orderId: string }) {
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

      const { cancellationFee } = await this.settings.get(OrderService.OrderSettings);
      const order = {
        status: 'recorded',
        recordedAt: new Date(),
        customer: {
          id: customerId,
          ...customer,
        },
        items: pricedInvoice.items,
        delivery,
        cancellationTerms: {
          fee: cancellationFee,
        },
        summary: pricedInvoice.summary,
      } satisfies OrderCreate;

      const orderId = await this.repository.create(order);

      // Reserve stocks
      await this.warehouse.reserveStock({ referenceId: orderId, items: reserve });

      const { paymentSessionId } = await this.payment.createPaymentSession({
        orderId,
        customerId,
      });

      await this.repository.updateOrderToSettlementStatus({
        id: orderId,
        ...order,
        status: 'settlement',
        paymentSessionId,
      });

      // [TODO]
      // await this.outbox.save({
      //   type: OrderRecordedEventType,
      //   payload: { orderId, occurredAt: new Date() } satisfies OrderEventPayload,
      // });
    });

    // [NOTE] no return, just redirect the customer to settlement page
    // the payment session is already created, so by navigating to
    // settlement page going to see an active order ready for settlement
  }

  /**
   *
   */
  async cancelOrder({ customerId, orderId }: { customerId: string; orderId: string }) {
    const order = await this.repository.findOrderByCustomerId(customerId, orderId);

    if (!order) throw new Error();

    switch (order.status) {
      case 'settlement':
        await this.tx.run(async () => {
          await this.repository.updateOrderToCanceledStatus({
            ...order,
            status: 'canceled',
            canceledAt: new Date(),
          });
          await this.payment.cancelPayment({ paymentSessionId: order.paymentSessionId });
        });
        break;
      case 'process':
      case 'courier-requested':
        {
          await this.tx.run(async () => {
            // update order status
            await this.repository.updateOrderToCanceledStatus({
              ...order,
              status: 'canceled',
              canceledAt: new Date(),
            });

            // calculate the cancellation fee and deduct from paid amount
            // and then charge the customer wallet.
            const fee = order.cancellationTerms.fee;
            let refund = Money.zero();
            if (fee.type === 'fixed')
              refund = order.summary.grandTotal.subtract(Money.create(fee.amount.value));
            else {
              refund = order.summary.grandTotal.subtract(
                order.summary.grandTotal.multiply(fee.rate),
              );
            }

            await this.wallet.deposit({
              customerId,
              amount: refund,
              referenceId: orderId,
              idempotencyKey: `order-canceled-${orderId}`,
              reason: 'refund',
            });
          });
        }
        break;
      default:
        throw new Error('Not cancelable at this stage');
    }
  }

  async setSettings({
    newSettings,
  }: {
    newSettings: (typeof OrderService.OrderSettings)['defaultValue'];
  }) {
    await this.settings.set(OrderService.OrderSettings, newSettings);
  }
}
