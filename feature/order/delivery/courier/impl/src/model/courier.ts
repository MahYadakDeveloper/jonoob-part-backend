import { LineItems } from '@feature/common';

export type Courier = {
  id: string;
  fullName: string;
  phone: string;

  deliveries: LineItems<{
    deliveryId: string;
  }>;
};
