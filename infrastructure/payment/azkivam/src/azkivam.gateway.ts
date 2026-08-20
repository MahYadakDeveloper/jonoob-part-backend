import { type OrderApi } from '@feature/order-api';
import {
  CreatePaymentTicketRequest,
  CreatePaymentTicketResponse,
  PaymentGateway,
  VerifyPaymentTicketRequest,
  VerifyPaymentTicketResponse,
} from '@feature/payment-gateway-api';
import { appConfig } from '@infra/config';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { azkivamConfig } from './azkivam.config';
import { CreateTicketRequest } from './azkivam.types';

@Injectable()
export class AzkivamGateway implements PaymentGateway {
  readonly name: string = 'azkivam' as const;
  readonly supportsPartialPayment: boolean = false;

  constructor(
    private readonly http: HttpService,
    private readonly order: OrderApi,
    @Inject(azkivamConfig.KEY)
    private readonly azkivam: ConfigType<typeof azkivamConfig>,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  /**
   *
   */
  async createPaymentTicket({
    orderId,
    providerId,
  }: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse> {
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
        url: this.app.webUrl,
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

  /**
   *
   */
  async verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse> {
    throw new Error('Method not implemented.');
  }
}
