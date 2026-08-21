import { type OutboxRepository } from '@feature/common';
import { type OrderApi } from '@feature/order-api';
import {
  CreatePaymentTicketRequest,
  CreatePaymentTicketResponse,
  PaymentGateway,
  TicketVerificationFailedEventPayload,
  TicketVerificationFailedEventType,
  TicketVerifiedEventPayload,
  TicketVerifiedEventType,
  VerifyPaymentTicketRequest,
  VerifyPaymentTicketResponse,
} from '@feature/payment-gateway-api';
import { appConfig } from '@infra/config';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { firstValueFrom } from 'rxjs';
import { PrismaAzkivamTicketRepository } from './azkivam-ticket.repository';
import { PrismaAzkivamTokenRepository } from './azkivam-token.repository';
import { azkivamConfig } from './azkivam.config';
import {
  AuthRequest,
  AuthResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  RefreshTokenResponse,
  VerifyTicketRequest,
  VerifyTicketResponse,
} from './azkivam.types';

@Injectable()
export class AzkivamGateway implements PaymentGateway {
  readonly name: string = 'azkivam' as const;
  readonly supportsPartialPayment: boolean = false;

  private readonly api: AxiosInstance;
  private refreshPromise?: Promise<string>;

  constructor(
    private readonly token: PrismaAzkivamTokenRepository,
    private readonly tickets: PrismaAzkivamTicketRepository,
    private readonly http: HttpService,
    private readonly order: OrderApi,
    @Inject(azkivamConfig.KEY)
    private readonly azkivam: ConfigType<typeof azkivamConfig>,
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
    private readonly outbox: OutboxRepository,
  ) {
    this.api = http.axiosRef.create({
      baseURL: `${this.azkivam.baseUrl}`,
    });

    this.setupApiInterceptor();
  }

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

    const callback = `${this.app.apiUrl}/payment/azkivam/callback?providerId=${providerId}`;

    const data: CreateTicketRequest = {
      amount: order.summary.grandTotal.value,
      mobile_number: order.customer.phone,
      provider_id: providerId,
      redirect_uri: callback,
      fallback_uri: callback,
      merchant_id: this.azkivam.merchantId,
      items,
    };

    const res = await this.api.post<CreateTicketResponse>(this.azkivam.createTicketEndpoint, data);

    await this.tickets.create({
      providerId,
      ticketId: res.data.result.ticket_id,
    });

    return {
      paymentUri: res.data.result.payment_uri,
    };
  }

  /**
   *
   */
  async verifyPaymentTicket({
    providerId,
  }: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse> {
    const ticket = await this.tickets.findByProviderId(providerId);

    if (!ticket) throw new Error('Ticket not found');

    const res = await this.api.post<VerifyTicketResponse>(this.azkivam.verifyTicketEndpoint, {
      ticket_id: ticket.ticketId,
    } satisfies VerifyTicketRequest);

    switch (res.data.result.status) {
      case 2: // verified
        await this.outbox.save({
          type: TicketVerifiedEventType,
          payload: { providerId } satisfies TicketVerifiedEventPayload,
        });

        return { status: 'verified' };

      case 5: // canceled
        await this.outbox.save({
          type: TicketVerificationFailedEventType,
          payload: {
            providerId,
            status: 'canceled',
          } satisfies TicketVerificationFailedEventPayload,
        });
        return { status: 'canceled' };

      default:
        await this.outbox.save({
          type: TicketVerificationFailedEventType,
          payload: {
            providerId,
            status: 'failure',
          } satisfies TicketVerificationFailedEventPayload,
        });
        return { status: 'failure' };
    }
  }

  private setupApiInterceptor() {
    this.api.interceptors.request.use(async (config) => {
      const token = await this.token.get();

      if (token?.accessToken) {
        config.headers.Authorization = `Bearer ${token.accessToken}`;
      }

      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,

      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const accessToken = await this.getValidAccessToken();

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return this.api(originalRequest);
        } catch (error) {
          return Promise.reject(error);
        }
      },
    );
  }

  private async authenticate(): Promise<string> {
    const { data } = await firstValueFrom(
      this.http.post<AuthResponse>(this.azkivam.authenticateEndpoint, {
        username: this.azkivam.username,
        password: this.azkivam.password,
      } satisfies AuthRequest),
    );

    await this.token.set({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data.accessToken;
  }

  private async refreshAccessToken(): Promise<string> {
    const currentToken = await this.token.get();

    if (!currentToken) {
      return this.authenticate();
    }

    const { data } = await firstValueFrom(
      this.http.post<RefreshTokenResponse>(this.azkivam.refreshTokenEndpoint, {
        refreshToken: currentToken.refreshToken,
      }),
    );

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken ?? currentToken.refreshToken;

    await this.token.set({
      accessToken,
      refreshToken,
    });

    return accessToken;
  }

  private getValidAccessToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken().finally(() => {
        this.refreshPromise = undefined;
      });
    }

    return this.refreshPromise;
  }
}
