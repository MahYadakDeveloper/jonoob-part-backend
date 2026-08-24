export type ConfirmDeliveryRequest =
  | {
      courierId: string;

      orderId: string;
      scope: 'intra-city';
      confirmationCode: string;
    }
  | {
      courierId: string;

      orderId: string;
      scope: 'inter-city';
      trackingCode: string;
    };

export interface PickingUpRequest {
  courierId: string;
  orderId: string;
}
