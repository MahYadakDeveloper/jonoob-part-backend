import { Customer } from '@feature/customer-api';
import { Delivery } from './order.type';

export interface OrderApi {
  getDeliveryConfirmationCodeOfHandedPackageOver(req: {
    orderId: string;
  }): Promise<{ code: string }>;
  getDeliveryAddress(req: { orderId: string }): Promise<{ delivery: Delivery }>;
  getRecipientInformation(req: {
    orderId: string;
  }): Promise<{ customer: { id: string } & Customer; delivery: Delivery }>;
}
