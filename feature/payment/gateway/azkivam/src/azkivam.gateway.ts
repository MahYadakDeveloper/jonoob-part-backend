import { type OrderApi } from '@feature/order-api';
import { PaymentGatewayApi } from '@feature/payment-gateway-api';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CreateTicketRequest } from './azkivam.types';

/**
 * [NOTE] If the customer cancels the payment on the IPG, the payment
 * session is not canceled. The customer is still redirected to the
 * payment session, where they can choose another payment method if
 * available. They may also cancel the payment manually or leave the
 * session to expire.
 *
 * If the session expires without a successful payment, the order is
 * marked as expired due to non-payment or customer cancellation.
 * The customer can then place the order again if desired.
 *
 * [TODO]
 * Move this in infrastructure layer
 */
@Injectable()
export class AzkivamGateway implements PaymentGatewayApi {
  private static readonly CREATE_TICKET_ENDPOINT = '/payment/purchase';
  private static readonly VERIFY_TICKET_ENDPOINT = '/payment/verify';

  readonly provider: string = 'azkivam';

  constructor(
    private readonly http: HttpService,
    private readonly order: OrderApi,
  ) {}

  async createPayment({
    orderId,
    providerId, // paymentSession.id
  }: {
    orderId: string;
    providerId: number;
  }): Promise<{ paymentUri: string }> {
    const { order } = await this.order.findById({ orderId });
    const items = order.items.toArray().map<CreateTicketRequest['items']['0']>(
      (item) => ({
        name: item.description,
        count: item.quantity,

        /**
         * [NOTE]
         * The amount is value of each single item
         */
        amount: item.lineTotal.divide(item.quantity).value,
        url: '[TODO]',
      }),
      (x) => x.productId,
    );

    const body: CreateTicketRequest = {
      amount: order.summary.grandTotal.value,
      mobile_number: order.customer.phone,
      provider_id: providerId,
      redirect_uri: '[TODO]',
      fallback_uri: '[TODO]',
      merchant_id: '[TODO]',
      items,
    };

    const res = await firstValueFrom(this.http.get('/'));
    throw new Error('Method not implemented.');
  }

  verifyPayment(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
