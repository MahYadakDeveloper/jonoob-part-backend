import {
  addDuration,
  Duration,
  Money,
  Payment,
  SettingToken,
  type SettingsStore,
} from '@feature/common';
import {
  GetPaymentGatewayByOrderIdRequest,
  GetPaymentGatewayByOrderIdResponse,
  InsufficientWalletBalanceError,
  InvalidWalletPaymentAmountError,
  PaymentSessionCreationRequest,
  PlanPaymentRequest,
  PlanPaymentResponse,
  WalletPaymentExceedsInvoiceError,
  type PaymentApi,
} from '@feature/payment-api';
import { type WalletApi } from '@feature/wallet-api';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { PaymentGatewayResolver } from './payment-gateway.resolver';
import { type PaymentSessionRepository } from './payment-session.repository';
import { PayRequest } from './payment.req';
import { PayResponse } from './payment.res';

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
 */

@Injectable()
export class PaymentService implements PaymentApi {
  private static readonly PaymentSettings: SettingToken<{ expiresDuration: Duration }> = {
    key: 'payment',
    defaultValue: {
      expiresDuration: {
        value: 1,
        unit: 'hour',
      },
    },

    schema: z.object({
      expiresDuration: z.object({
        value: z.number().positive(),
        unit: z.enum(['month', 'year', 'week', 'hour', 'minute']),
      }),
    }),
  };

  constructor(
    private readonly wallet: WalletApi,
    private readonly repository: PaymentSessionRepository,
    private readonly settings: SettingsStore,
    private readonly gateways: PaymentGatewayResolver,
  ) {}

  async createPaymentSession(
    req: PaymentSessionCreationRequest,
  ): Promise<{ paymentSessionId: number }> {
    const { expiresDuration } = await this.settings.get(PaymentService.PaymentSettings);
    const expiresAt = addDuration(new Date(), expiresDuration);
    const { providerId } = await this.repository.create({
      orderId: req.orderId,
      expiresAt,
      status: 'created',
    });

    return {
      paymentSessionId: providerId,
    };
  }

  /**
   * [TODO]
   * Try first see if is the money can be reversed|refunded by the payment|credit gateway provider
   * if the operation is not available then refund the money to their(customer) wallet
   */
  cancelPayment({ paymentSessionId }: { paymentSessionId: number }): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getPaymentGatewayByOrderId(
    req: GetPaymentGatewayByOrderIdRequest,
  ): Promise<GetPaymentGatewayByOrderIdResponse> {
    throw new Error('Method not implemented.');
  }

  getTrackingCode(req: { providerId: number }): Promise<{ trackingCode: string }> {
    throw new Error('Method not implemented.');
  }

  pay({ providerId, gatewayName }: PayRequest): Promise<PayResponse> {
    const gateway = this.gateways.resolve(gatewayName);

    // [TODO] Update expire duration with the expire duration of individual gateway

    // [TODO] count attempts in (redis) for individual session
    // if exceeded then throw error

    throw new Error('Method not implemented.');
  }

  async planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse> {
    if (req.kind === 'guest')
      return {
        payment: {
          kind: 'external',
          external: {
            method: 'posTerminal',
            amount: req.amountDue,
          },
        },
      };

    const { amountDue, customerId, useWallet } = req;

    const balance = await this.wallet.getBalance({ customerId });

    let walletAmount = Money.zero();

    if (useWallet) {
      if (useWallet.mode === 'full') {
        walletAmount = Money.min(balance.available, amountDue);
      } else {
        if (useWallet.amount.lte(Money.zero())) {
          throw new InvalidWalletPaymentAmountError(useWallet.amount);
        }

        if (useWallet.amount.gt(amountDue)) {
          throw new WalletPaymentExceedsInvoiceError(useWallet.amount, amountDue);
        }

        if (balance.available.lt(useWallet.amount)) {
          throw new InsufficientWalletBalanceError(customerId, useWallet.amount, balance.available);
        }

        walletAmount = useWallet.amount;
      }
    }

    const remaining = amountDue.subtract(walletAmount);

    const payment: Payment = remaining.isZero()
      ? {
          kind: 'wallet',
          walletAmount,
        }
      : walletAmount.isZero()
        ? {
            kind: 'external',
            external: {
              method: 'posTerminal',
              amount: remaining,
            },
          }
        : {
            kind: 'mixed',
            walletAmount,
            external: {
              method: 'posTerminal',
              amount: remaining,
            },
          };

    return { payment };
  }
}
