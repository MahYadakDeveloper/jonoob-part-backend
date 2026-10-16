import type { CustomersApi } from '@feature/actors-api/customer';
import { type CatalogApi } from '@feature/catalog-api';
import { type PricingApi } from '@feature/pricing-api';
import type { MerchandiseLine } from '@feature/shared/types/merchandise-line';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { DrizzleSettingsStore } from '@infra/settings-store';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderSettings, orderSettings } from './order.settings';
import { OrderRepository } from './repository/order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly repository: OrderRepository,
    private readonly customers: CustomersApi,
    private readonly catalog: CatalogApi,
    private readonly pricing: PricingApi,
    private readonly tx: DrizzleTransactionContext,
    private readonly settings: DrizzleSettingsStore,
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

  async placeOrder({
    customerId,
    delivery,
    items,
  }: {
    customerId: string;
    delivery: {
      addressId: string;
      carrierKey?: string;
    };
    items: { productId: string; quantity: number }[];
  }): Promise<{ id: string }> {
    if (items.length === 0)
      throw new BadRequestException('Order must contain at least one item');
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity <= 0))
      throw new BadRequestException('Item quantity must be a positive integer');

    const customer = await this.customers.findById(customerId);

    const address = customer.addresses.find((a) => a.id === delivery.addressId);
    if (!address) throw new BadRequestException('Address not found');
    if (address.scope === 'inter_city' && !delivery.carrierKey)
      throw new BadRequestException(
        'Carrier is required for inter-city delivery',
      );

    const products = await this.catalog.findMany(items.map((i) => i.productId));

    // pricing
    const priceResult = await this.pricing.price(
      {
        customer: {
          id: customer.id,
          type: customer.type,
        },
        asOf: new Date(),
      },
      items,
    );

    const { cancellationFee } = await this.settings.get(orderSettings);

    const productsById = new Map(products.map((p) => [p.id, p]));
    const merchandiseLines = items.map((item, index): MerchandiseLine => {
      const product = productsById.get(item.productId);
      const priced = priceResult.items[index];
      if (!product || !priced || priced.productId !== item.productId)
        throw new Error(
          `Pricing result mismatch for product ${item.productId}`,
        );

      const discount = priced.discount && {
        discountPerUnit: priced.discount.perUnit,
        discountedQuantity: priced.discount.quantity,
        totalDiscount: priced.discount.total,
      };
      const base = {
        productId: product.id,
        displayName: product.displayName,
        quantity: priced.quantity,
        unitPrice: priced.unitPrice,
        lineTotal: priced.net,
        ...(discount && { discount }),
      };

      if (product.kind === 'leaf') return { ...base, kind: 'leaf' };

      const componentsByProductId = new Map(
        (priced.components ?? []).map((c) => [c.productId, c]),
      );
      return {
        ...base,
        kind: 'bundle',
        items: product.items.map((component) => {
          const pricedComponent = componentsByProductId.get(component.id);
          if (!pricedComponent)
            throw new Error(`Missing priced component ${component.id}`);

          return {
            productId: component.id,
            displayName: component.displayName,
            quantity: pricedComponent.quantity,
            unitPrice: pricedComponent.unitPrice,
            lineTotal: pricedComponent.lineTotal,
          };
        }),
      };
    });

    const { totals } = priceResult;

    return this.tx.run(() =>
      this.repository.withLock('order:place', customerId, async () => {
        // [NOTE]
        // Only single order with pending payment state at a time
        if (await this.repository.hasPendingPaymentByCustomerId(customerId))
          throw new ConflictException(
            'Customer already has an order awaiting payment',
          );

        return this.repository.create({
          customerId,
          merchandiseLines,
          cancellationFee,
          summary: {
            subtotal: totals.subtotal,
            discountTotal: totals.discount,
            taxTotal: 0,
            grandTotal: totals.net,
          },
          recipient: {
            customerContact: {
              fullName: customer.fullName,
              phone: customer.phone,
              type: customer.type,
            },
            ...address,
          },
          carrierKey: delivery.carrierKey,
        });
      }),
    );
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
