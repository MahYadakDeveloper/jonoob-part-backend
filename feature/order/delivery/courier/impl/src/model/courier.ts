import { Delivery } from '@feature/order-delivery-api';

export type Courier = {
  id: string;
  fullName: string;
  phone: string;

  deliveries: Delivery[];
};
