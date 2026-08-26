import {
  addDuration,
  Duration,
  Money,
  Payment,
  SettingToken,
  type JobScheduler,
  type SettingsStore,
  type TransactionManager,
} from '@feature/common';
import { type OrderApi } from '@feature/order-api';
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
  private static readonly PaymentSettings: SettingToken<{ expiry: Duration }> = {
    key: 'payment',
    defaultValue: {
      expiry: {
        value: 30,
        unit: 'minute',
      },
    },

    schema: z.object({
      expiry: z.object({
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
    private readonly order: OrderApi,
    private readonly tx: TransactionManager,
    private readonly job: JobScheduler,
  ) {}

  async createPaymentSession(
    req: PaymentSessionCreationRequest,
  ): Promise<{ paymentSessionId: number }> {
    const { expiry } = await this.settings.get(PaymentService.PaymentSettings);
    const expiresAt = addDuration(new Date(), expiry);

    const handle = await this.job.schedule(expiresAt, async () => {});

    const { providerId } = await this.repository.create({
      orderId: req.orderId,
      expiryJob: handle,
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
  async refund({
    paymentSessionId,
  }: {
    paymentSessionId: number;
  }): Promise<{ refundedTo: 'wallet' | 'payment_reversed' }> {
    const session = await this.repository.findByProviderId(paymentSessionId);
    if (!session?.gateway) throw new Error();

    if (session.gateway.status !== 'paid') throw new Error();

    const gateway = this.gateways.resolve(session.gateway.name);

    try {
      await gateway.refundPaymentTicket({
        providerId: paymentSessionId,
        ticketId: session.gateway.transactionId,
      });

      return {
        refundedTo: 'payment_reversed',
      };
    } catch (err) {
      const { summary } = await this.order.getOrderSummary({ orderId: session.orderId });
      const { customer } = await this.order.getRecipientInformation({ orderId: session.orderId });
      await this.wallet.deposit({
        amount: summary.grandTotal,
        customerId: customer.id,
        reason: 'refund',
        referenceId: session.orderId,
        idempotencyKey: `order-refunded:${session.orderId}`,
      });

      return {
        refundedTo: 'wallet',
      };
    }
  }

  async getPaymentGatewayByOrderId({
    orderId,
  }: GetPaymentGatewayByOrderIdRequest): Promise<GetPaymentGatewayByOrderIdResponse> {
    const session = await this.repository.findByOrderId(orderId);
    if (!session?.gateway) throw new Error();

    return { gateway: session.gateway.name };
  }

  async getTrackingCode({ providerId }: { providerId: number }): Promise<{ trackingCode: string }> {
    const session = await this.repository.findByProviderId(providerId);

    if (!session?.gateway) throw new Error();

    const gateway = this.gateways.resolve(session.gateway.name);
    const { ticketId } = await gateway.getPaymentTicketId({ providerId });

    return {
      trackingCode: ticketId,
    };
  }

  async pay({ providerId, gatewayName, useWallet }: PayRequest): Promise<PayResponse> {
    const session = await this.repository.findByProviderId(providerId);
    if (!session) throw new Error();
    if (session.gateway?.status === 'paid') throw new Error();

    const gateway = this.gateways.resolve(gatewayName);

    const expiryExecutionDate = await this.job.getExecutionDate(session.expiryJob.id);
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + gateway.expiryInMinutes + gateway.verificationDeadlineInMinutes,
    );

    // [NOTE] The expired state means even if money paid they would refunded by gateway provider
    if (expiryExecutionDate < expiresAt) await this.job.update(session.expiryJob.id, expiresAt);

    if (!gateway.supportsPartialPayment && useWallet) throw new Error();

    const { customer: customerContact } = await this.order.getRecipientInformation({
      orderId: session.orderId,
    });
    const { items: purchasedItems } = await this.order.getOrderItems({ orderId: session.orderId });
    const { summary } = await this.order.getOrderSummary({ orderId: session.orderId });

    return await this.tx.run(async () => {
      const { paymentUrl } = await gateway.createPaymentTicket({
        providerId,
        useWallet,
        customerContact,
        purchasedItems,
        summary,
      });

      await this.repository.updateGatewayStatus({
        name: gateway.name,
        status: 'created',
      });

      return {
        paymentUrl,
      };
    });
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
