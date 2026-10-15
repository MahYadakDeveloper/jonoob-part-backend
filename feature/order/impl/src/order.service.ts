import type { CustomersApi } from '@feature/actors-api/customer';
import { type CatalogApi } from '@feature/catalog-api';
import { type PricingApi } from '@feature/pricing-api';
import { Money, type SettingsStore } from '@feature/shared';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { type OrderRepository } from './order.repository';
import { OrderSettings, orderSettings } from './order.settings';

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly customers: CustomersApi,
    private readonly catalog: CatalogApi,
    private readonly payment: PaymentApi,
    private readonly pricing: PricingApi,
    private readonly fulfillment: FulfillmentApi,
    private readonly delivery: DeliveryApi,
    private readonly tx: DrizzleTransactionContext,
    private readonly settings: SettingsStore,
  ) {}

  async findById(orderId: string) {
    const order = await this.repository.findById(orderId);
    if (!order) throw new NotFoundException();

    return order;
  }

  async findManyByCustomerId(customerId: string) {
    const order = await this.repository.findByCustomerId(customerId);

    if (order.length === 0) throw new Error();

    return order;
  }

  async recordOrder({
    customerId,
    recipient,
    items,
  }: {
    customerId: string;
    recipient: {
      addressId: string;
      carrierKey: string;
    };
    items: { productId: string; quantity: number }[];
  }) {
    // [NOTE]
    // Only single order with pending payment state at a time
    const hasPendingPayment =
      await this.repository.hasPendingPaymentByCustomerId(customerId);
    if (hasPendingPayment)
      throw new ConflictException(
        `Customer has none active none settled order`,
      );

    const customer = await this.customers.findById(customerId);

    const address = customer.addresses.find(
      (a) => a.id === recipient.addressId,
    );

    if (!address) throw new BadRequestException('Address not found');
    if (address.scope === 'inter_city' && !recipient.carrierKey)
      throw new Error();

    const products = await this.catalog.findMany(items.map((i) => i.productId));

    // pricing
    const { pricedInvoice } = await this.pricing.price(customerId, {
      items: items.map(
        ({ productId, quantity }) => {
          const product = products.find(item.productId);
          if (!product) throw new UnprocessableEntityException('...');
          if (product.kind === 'bundle')
            return {
              kind: 'bundle',
              productId,
              quantity,
              items: product.items.map((bundleItem) => ({
                kind: 'leaf',
                productId: bundleItem.productId,
                description: bundleItem.displayName,
                quantity: bundleItem.quantity,
              })),
            };

          return {
            kind: 'leaf',
            productId: productId,
            description: product.displayName,
            quantity: quantity,
          };
        },
        (item) => item.description,
      ),
    });

    const { cancellationFee } = await this.settings.get(orderSettings);

    return await this.tx.run(async () => {
      const orderId = await this.repository.create({
        customerId,
        items: pricedInvoice.items,
        cancellationTerms: {
          fee: cancellationFee,
        },
        summary: pricedInvoice.summary,
      });

      await this.delivery.create({
        orderId,
        recipient: {
          customerContact: {
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            type: customer.type,
          },
          ...(address.scope === 'inter_city'
            ? {
                ...address,
                carrierKey: recipient.carrierKey,
              }
            : {
                ...address,
              }),
        },
      });

      // payment
      await this.payment.create({
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
  async cancelOrder({ orderId }: { orderId: string }) {
    const order = await this.repository.findById(orderId);

    if (!order) throw new Error();

    await this.tx.run(async () => {
      switch (order.status) {
        case 'process':
          await this.payment.refund({
            type: 'full',
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
                refund = order.summary.grandTotal.subtract(
                  Money.create(fee.amount.value),
                );
              else {
                refund = order.summary.grandTotal.subtract(
                  order.summary.grandTotal.multiply(fee.rate),
                );
              }

              // [TODO] make payment refund segmented
              await this.payment.refund({
                type: 'partial',
                amount: refund,
                sessionId: order.payment.sessionId,
                customerId: order.customerId,
              });

              await this.delivery.cancelDelivery({ orderId });
              await this.repository.markAs(orderId, 'canceled_by_customer');
              break;
            default:
              throw new Error(
                'Cancel at this stage of delivery is not possible',
              );
          }
          break;
        default:
          throw new Error('Not cancelable at this stage');
      }
    });
  }

  async setSettings({ settings }: { settings: OrderSettings }) {
    await this.settings.set(orderSettings, settings);
  }
}
