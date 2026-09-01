import { type OutboxRepository } from '@feature/common';
import {
  CreatePaymentTicketRequest,
  CreatePaymentTicketResponse,
  GetTicketStatusRequest,
  GetTicketStatusResponse,
  PaymentGateway,
  TicketVerificationFailedEventPayload,
  TicketVerificationFailedEventType,
  TicketVerifiedEventPayload,
  TicketVerifiedEventType,
  VerifyPaymentTicketRequest,
  VerifyPaymentTicketResponse,
} from '@feature/order-payment-gateway-api';
import { appConfig } from '@infra/config';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { AxiosInstance } from 'axios';
import { firstValueFrom } from 'rxjs';
import { PrismaAzkivamTokenRepository } from './azkivam-token.repository';
import { azkivamConfig } from './azkivam.config';
import {
  AuthRequest,
  AuthResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  RefreshTokenResponse,
  TicketStatus,
  TicketStatusRequest,
  TicketStatusResponse,
  VerifyTicketRequest,
  VerifyTicketResponse,
} from './azkivam.types';

@Injectable()
export class AzkivamGateway implements PaymentGateway {
  readonly key: string = 'azkivam' as const;
  readonly expiryInMinutes: number = 1;
  readonly verificationDeadlineInMinutes: number = 1;
  readonly supportsPartialPayment: boolean = false;

  private readonly api: AxiosInstance;
  private refreshPromise?: Promise<string>;

  constructor(
    private readonly token: PrismaAzkivamTokenRepository,
    private readonly http: HttpService,
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

  refundPaymentTicket(req: {
    ticketId: string;
    providerId: number;
  }): Promise<{ result: 'refunded' | 'failed' }> {
    throw new Error('Method not implemented.');
  }

  /**
   *
   */
  async createPaymentTicket({
    providerId,
    customerContact,
    purchasedItems,
    amount,
  }: CreatePaymentTicketRequest): Promise<CreatePaymentTicketResponse> {
    const items = purchasedItems.toArray().map<CreateTicketRequest['items']['0']>((item) => ({
      name: item.productName,
      count: item.quantity,

      /**
       * [NOTE]
       * The amount is value of each single item
       */
      amount: item.unitPrice.value,
      url: `${this.app.productsUrl}/${item.productId}`,
    }));

    const callback = `${this.app.apiUrl}/payment/azkivam/callback?providerId=${providerId}`;

    const data: CreateTicketRequest = {
      amount: amount.value,
      mobile_number: customerContact.phoneNumber,
      provider_id: providerId,
      redirect_uri: callback,
      fallback_uri: callback,
      merchant_id: this.azkivam.merchantId,
      items,
    };

    const res = await this.api.post<CreateTicketResponse>(this.azkivam.createTicketEndpoint, data);

    return {
      paymentUrl: res.data.result.payment_uri,
      ticketId: res.data.result.ticket_id,
    };
  }

  /**
   *
   */
  async verifyPaymentTicket({
    providerId,
    ticketId,
  }: VerifyPaymentTicketRequest): Promise<VerifyPaymentTicketResponse> {
    const { status } = await this._getTicketStatus({ ticketId: ticketId });

    switch (status) {
      case 'done': {
        const res = await this.api.post<VerifyTicketResponse>(this.azkivam.verifyTicketEndpoint, {
          ticket_id: ticketId,
        } satisfies VerifyTicketRequest);

        switch (res.data.result.status) {
          case 2: // verified
            await this.outbox.save({
              type: TicketVerifiedEventType,
              payload: {
                providerId,
              } satisfies TicketVerifiedEventPayload,
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
                status: 'failed',
              } satisfies TicketVerificationFailedEventPayload,
            });
            return { status: 'failed' };
        }
      }
      case 'canceled':
      case 'expired':
      case 'reversed':
        await this.outbox.save({
          type: TicketVerificationFailedEventType,
          payload: {
            providerId,
            status,
          } satisfies TicketVerificationFailedEventPayload,
        });
        return { status };
      case 'verified':
      case 'settled':
        await this.outbox.save({
          type: TicketVerificationFailedEventType,
          payload: {
            providerId,
            status: 'verified-before',
          } satisfies TicketVerificationFailedEventPayload,
        });
        return { status: 'verified-before' };
      default:
        await this.outbox.save({
          type: TicketVerificationFailedEventType,
          payload: {
            providerId,
            status: 'failed',
          } satisfies TicketVerificationFailedEventPayload,
        });
        return { status: 'failed' };
    }
  }

  async getTicketStatus({ ticketId }: GetTicketStatusRequest): Promise<GetTicketStatusResponse> {
    const { status } = await this._getTicketStatus({ ticketId });

    switch (status) {
      case 'created':
      case 'settleQueued':
      case 'done':
        return { status: 'pending' };
      case 'canceled':
        return { status: 'canceled' };
      case 'settled':
      case 'verified':
        return { status: 'verified' };
      case 'expired':
        return { status: 'expired' };
      case 'failed':
        return { status: 'failed' };
      case 'reversed':
        return { status: 'reversed' };
    }
  }

  private async _getTicketStatus({
    ticketId,
  }: {
    ticketId: string;
  }): Promise<{ status: TicketStatus }> {
    const res = await this.api.post<TicketStatusResponse>(this.azkivam.ticketStatusEndpoint, {
      ticket_id: ticketId,
    } satisfies TicketStatusRequest);
    return { status: TicketStatus[res.data.result.status] };
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
