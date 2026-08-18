import { LineItems } from '@feature/common';
import { Customer, CustomerAddress } from '@feature/customer-api';

type IntraCityDelivery = {
  scope: 'intra-city';
  carrier: 'courier';
} & Omit<Extract<CustomerAddress, { scope: 'intra-city' }>, 'scope'>;

type InterCityDelivery = {
  scope: 'inter-city';
  carrier: {
    provider: string;
  };
} & Omit<Extract<CustomerAddress, { scope: 'inter-city' }>, 'scope'>;

export type Delivery = InterCityDelivery | IntraCityDelivery;

export type BaseOrder = {
  orderId: string;
  customer: { id: string } & Customer;
  items: LineItems<{ productId: string; quantity: number }>;
};

export type Order = BaseOrder &
  (
    | {
        status: 'pending-payment' | 'cancelled';
        delivery: Delivery;
      }
    | ({
        payment: Payment;
      } & (
        | {
            status: 'process' | 'in-editing' | 'cancelled';
            delivery: Delivery;
          }
        | {
            status: 'courier-requested' | 'in-editing' | 'cancelled';
            delivery: Delivery;
          }
        | (
            | {
                status: 'handed-over-to-courier';
                handedOver: Date;
                delivery:
                  | (IntraCityDelivery & {
                      deliveryConfirmationCode: string;
                    })
                  | InterCityDelivery;
              }
            | {
                status: 'delivered';
                deliveredAt: Date;
                delivery:
                  | (IntraCityDelivery & {
                      deliveryConfirmationCode: string;
                    })
                  | (InterCityDelivery & {
                      trackingNumber: string;
                    });
              }
          )
      ))
  );

type Payment = {};
type Status = 'settlement' | 'preparing' | 'in-delivery' | 'delivered';

declare const order: Order;

if (order.status === 'in-delivery') {
  if (order.delivery.scope === 'intra-city') {
    order.delivery.deliveryConfirmationCode;
    // ✅ string
  }

  if (order.delivery.scope === 'inter-city') {
    order.delivery.trackingNumber;
    // ✅ string
  }
}

if (order.status === 'in-delivery') {
  const recipient = order.recipient;

  if (recipient.scope === 'intra-city') {
    order.deliveryConfirmationCode;
  }
}
