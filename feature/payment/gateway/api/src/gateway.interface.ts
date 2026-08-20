export interface PaymentGateway {
  name: string;
  /**
   * Generate Token / Auth
   *
   * [NOTE]
   *  Based on the token generated then generate link from its api
   * mentioned from provider documentation for example return url
   * link
   */
  createPayment({
    orderId,
    providerId,
  }: {
    orderId: string;
    providerId: number; // paymentSession.id
  }): Promise<{ paymentUri: string }>;

  verifyPayment({ providerId }: { providerId: string }): Promise<void>;
}
