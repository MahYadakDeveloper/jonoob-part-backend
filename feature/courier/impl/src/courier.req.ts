export type ConfirmDeliveryRequest =
  | {
      deliveryId: string;

      orderId: string;
      scope: 'intra-city';
      confirmationCode: string;
    }
  | {
      deliveryId: string;

      orderId: string;
      scope: 'inter-city';
      trackingCode: string;
    };
