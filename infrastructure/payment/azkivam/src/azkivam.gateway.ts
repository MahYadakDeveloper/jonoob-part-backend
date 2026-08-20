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
import { PrismaAzkivamTicketRepository } from './azkivam-ticket.repository';
import { PrismaAzkivamTokenRepository } from './azkivam-token.repository';
import { azkivamConfig } from './azkivam.config';
import { CreateTicketRequest, CreateTicketResponse } from './azkivam.types';

@Injectable()
export class AzkivamGateway implements PaymentGateway {
  readonly name: string = 'azkivam' as const;
  readonly supportsPartialPayment: boolean = false;

  constructor(
    private readonly token: PrismaAzkivamTokenRepository,
    private readonly tickets: PrismaAzkivamTicketRepository,
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
        url: `${this.app.productsUrl}/${item.productId}`,
      }),
      (x) => x.productId,
    );

    const callback = `${this.app.apiUrl}/payment/callback?providerId=${providerId}`;

    const body: CreateTicketRequest = {
      amount: order.summary.grandTotal.value,
      mobile_number: order.customer.phone,
      provider_id: providerId,
      redirect_uri: callback,
      fallback_uri: callback,
      merchant_id: this.azkivam.merchantId,
      items,
    };

    const token = await this.resolveToken();

    try {
      const res = await firstValueFrom(
        this.http.post<CreateTicketResponse>(
          `${this.azkivam.baseUrl}${this.azkivam.createTicketEndpoint}`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.accessToken}`,
            },
          },
        ),
      );

      await this.tickets.create({ providerId, ticketId: res.data.result.ticket_id });

      return {
        paymentUri: res.data.result.payment_uri,
      };
    } catch (err) {
      const refreshedToken = await this.authenticate();
      const res = await firstValueFrom(
        this.http.post<CreateTicketResponse>(
          `${this.azkivam.baseUrl}${this.azkivam.createTicketEndpoint}`,
          body,
          {
            headers: {
              'Content-Type': 'application-json',
              Authorization: `Bearer ${refreshedToken.accessToken}`,
            },
          },
        ),
      );

      await this.tickets.create({ providerId, ticketId: res.data.result.ticket_id });
      return {
        paymentUri: res.data.result.payment_uri,
      };
    }
  }

  /**
   *
   */
  async verifyPaymentTicket(req: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse> {
    throw new Error('Method not implemented.');
  }

  private async resolveToken() {
    let token = await this.token.get();
    if (!token) {
      const res = await firstValueFrom(
        this.http.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${this.azkivam.baseUrl}${this.azkivam.authenticationEndpoint}`, {
          username: this.azkivam.username,
          password: this.azkivam.password,
        }),
      );

      token = {
        key: 'default',
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      };

      await this.token.set(token);
    }

    return token;
  }

  private async authenticate() {
    const res = await firstValueFrom(
      this.http.post<{
        accessToken: string;
        refreshToken: string;
      }>(`${this.azkivam.baseUrl}${this.azkivam.authenticationEndpoint}`, {
        username: this.azkivam.username,
        password: this.azkivam.password,
      }),
    );

    const token = {
      key: 'default',
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    };

    await this.token.set(token);

    return token;
  }
}
