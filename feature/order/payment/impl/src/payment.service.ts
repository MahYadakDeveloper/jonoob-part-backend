import { Money, type JobScheduler, type TransactionManager } from '@feature/common';
import { type WalletApi } from '@feature/customer-wallet-api';
import { type OrderApi } from '@feature/order-api';
import {
  InsufficientWalletBalanceError,
  InvalidWalletPaymentAmountError,
  Payment,
  PaymentAllocation,
  PaymentMethod,
  PaymentSessionCreationRequest,
  SettleRequest,
  SettleResponse,
  WalletPaymentExceedsInvoiceError,
  WalletUsage,
  type PaymentApi,
} from '@feature/order-payment-api';
import { Injectable } from '@nestjs/common';
import { PaymentGatewayResolver } from './payment-gateway.resolver';
import { type PaymentSessionRepository } from './payment-session.repository';

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
  constructor(
    private readonly wallet: WalletApi,
    private readonly repository: PaymentSessionRepository,
    private readonly gateways: PaymentGatewayResolver,
    private readonly order: OrderApi,
    private readonly tx: TransactionManager,
    private readonly job: JobScheduler,
  ) {}
  async createPaymentSession(
    req: PaymentSessionCreationRequest,
  ): Promise<{ payment: Extract<Payment, { status: 'initiated' }> }> {
    const total = req.purchasedItems.reduce(
      (acc, item) => acc.add(item.unitPrice.multiply(item.quantity)),
      Money.zero(),
    );
    if (!total.equals(req.amount)) throw new Error();

    const expiresAt = new Date();

    const handle = await this.job.schedule(expiresAt, async () => {
      const session = await this.repository.findByOrderId(req.orderId);
      if (!session) return;

      if (session.status !== 'pending' && session.status !== 'initiated') return;

      // [TODO]
    });

    const data = await this.repository.create({
      ...req,
      status: 'initiated',
      expiryJob: handle,
    });

    return {
      payment: data,
    };
  }

  async settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse> {
    const session = await this.repository.findById(req.sessionId);
    if (!session) throw new Error();
    const total = session.purchasedItems.reduce(
      (acc, item) => acc.add(item.unitPrice.multiply(item.quantity)),
      Money.zero(),
    );
    if (!total.equals(session.amount)) throw new Error();

    const allocation = await this.allocatePayment({
      amount: session.amount,
      customerId: req.customerId,
      walletUsage: req.method === 'wallet' ? req.walletUsage : undefined,
    });

    switch (req.method) {
      case 'wallet':
        const walletAllocation = allocation as PaymentAllocation<'wallet'>;
        return await this.tx.run(async () => {
          await this.wallet.withdraw({
            amount: walletAllocation.amount,
            customerId: req.customerId,
            reason: 'payment',
            referenceId: session.orderId,
            idempotencyKey: `order-payment:${session.orderId}`,
          });

          await this.repository.updatePaymentStatusTo<'paid'>({
            sessionId: session.sessionId,
            status: 'paid',
            method: 'wallet',
            allocation: walletAllocation,
            paidAt: new Date(),
          });

          return {
            payment: {
              sessionId: session.sessionId,
              status: 'paid',
              method: 'wallet',
              allocation: walletAllocation,
              paidAt: new Date(),
            },
          };
        });
      case 'partial':
      case 'gateway':
        if (!req.gatewayKey) throw new Error();

        const gateway = this.gateways.resolve(req.gatewayKey);

        if (req.method === 'partial' && !gateway.supportsPartialPayment) throw new Error();

        return await this.tx.run(async () => {
          if (req.method === 'partial') {
            await this.wallet.withdraw({
              amount: (allocation as PaymentAllocation<'partial'>).walletAmount,
              customerId: req.customerId,
              reason: 'payment',
              referenceId: session.orderId,
              idempotencyKey: `order-payment:${session.orderId}`,
            });
          }

          const expiresAt = new Date();
          expiresAt.setMinutes(
            expiresAt.getMinutes() +
              gateway.expiryInMinutes +
              gateway.verificationDeadlineInMinutes,
          );
          const handle = await this.job.schedule(expiresAt, async () => {});

          await this.repository.updatePaymentStatusTo<'pending'>({
            sessionId: session.sessionId,
            expiryJob: handle,
            status: 'pending',
            allocation: allocation as PaymentAllocation<'partial' | 'gateway'>,
            gatewayKey: req.gatewayKey,
            method: req.method,
          });

          const { paymentUrl } = await gateway.createPaymentTicket({
            providerId: session.sessionId,
            customerContact: session.customerContact,
            purchasedItems: session.purchasedItems,
            amount: allocation.kind === 'partial' ? allocation.gatewayAmount : allocation.amount,
          });

          return {
            payment: {
              sessionId: session.sessionId,

              status: 'pending',
              allocation: allocation as PaymentAllocation<'partial' | 'gateway'>,
              gatewayKey: req.gatewayKey,
              method: req.method,
            },
            paymentUrl,
          };
        });

      default:
        throw new Error('Unhandled payment method');
    }
  }

  /**
   * [TODO]
   * Try first see if is the money can be reversed|refunded by the payment|credit gateway provider
   * if the operation is not available then refund the money to their(customer) wallet
   */
  async refund({ sessionId, customerId, amount }: RefundRequest): Promise<RefundResponse> {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new Error();

    if (session.status !== 'paid') throw new Error();

    const gateway = this.gateways.resolve(session.gatewayKey);

    try {
      if (session.allocation.kind !== 'gateway') throw new Error();

      await gateway.refundPaymentTicket({
        providerId: sessionId,
        ticketId: session.allocation.transactionId,
      });

      const data = {
        ...session,
        refundedAt: new Date(),
        destination: 'gateway',
        status: 'refunded',
      } satisfies Extract<Payment, { status: 'refunded' }>;

      await this.repository.updatePaymentStatusTo<'refunded'>(data);

      return {
        payment: data,
      };
    } catch (err) {
      await this.wallet.deposit({
        amount,
        customerId,
        reason: 'refund',
        referenceId: session.orderId,
        idempotencyKey: `order-refunded:${session.orderId}`,
      });

      return {
        payment: {
          ...session,
          refundedAt: new Date(),
          destination: 'wallet',
          status: 'refunded',
        },
      };
    }
  }

  async getTrackingCode({ sessionId }: { sessionId: number }): Promise<{ trackingCode: string }> {
    const session = await this.repository.findById(sessionId);

    if (!session) throw new Error();

    if (session.status !== 'pending') throw new Error();
    if (session.allocation.kind !== 'gateway') throw new Error();

    const gateway = this.gateways.resolve(session.allocation.gatewayKey);
    const { ticketId } = await gateway.getPaymentTicketId({ providerId: sessionId });

    return {
      trackingCode: ticketId,
    };
  }

  private async allocatePayment({
    amount,
    customerId,
    walletUsage,
  }: {
    amount: Money;
    customerId: string;
    walletUsage?: WalletUsage;
  }): Promise<PaymentAllocation<PaymentMethod>> {
    const balance = await this.wallet.getBalance({ customerId });

    let walletAmount = Money.zero();

    if (walletUsage) {
      if (walletUsage.mode === 'full') {
        walletAmount = Money.min(balance.available, amount);
      } else {
        if (walletUsage.amount.lte(Money.zero())) {
          throw new InvalidWalletPaymentAmountError(walletUsage.amount);
        }

        if (walletUsage.amount.gt(amount)) {
          throw new WalletPaymentExceedsInvoiceError(walletUsage.amount, amount);
        }

        if (balance.available.lt(walletUsage.amount)) {
          throw new InsufficientWalletBalanceError(
            customerId,
            walletUsage.amount,
            balance.available,
          );
        }

        walletAmount = walletUsage.amount;
      }
    }

    const remaining = amount.subtract(walletAmount);

    const allocation: PaymentAllocation<PaymentMethod> = remaining.isZero()
      ? {
          kind: 'wallet',
          amount,
        }
      : walletAmount.isZero()
        ? {
            kind: 'gateway',
            amount,
          }
        : {
            kind: 'partial',
            walletAmount,
            gatewayAmount: remaining,
          };

    return allocation;
  }
}
