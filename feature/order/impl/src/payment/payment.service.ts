import type { WalletApi } from '@feature/actors-api/customer/wallet';
import {
  InvalidWalletPaymentAmountError,
  Payment,
  PaymentAllocation,
  PaymentMethod,
  RefundRequest,
  SettleRequest,
  SettleResponse,
  WalletUsage,
} from '@feature/order-payment-api';
import { DrizzleTransactionContext } from '@infra/db-drizzle';
import { PaymentGatewayResolver } from '@infra/payment-gateway';
import { RedlockSynchronizer } from '@infra/synchronizer';
import { Injectable } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { FulfillmentService } from '../fulfillment/fulfillment.service';
import { OrderRepository } from '../order.repository';
import { TicketStatus } from './gateway.interface';
import { PaymentRepository } from './payment.repository';

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
export class PaymentService {
  constructor(
    private readonly wallet: WalletApi,
    private readonly repository: PaymentRepository,
    private readonly gateways: PaymentGatewayResolver,
    private readonly tx: DrizzleTransactionContext,
    private readonly synchronizer: RedlockSynchronizer,
    private readonly orders: OrderRepository,
    private readonly fulfillment: FulfillmentService,
    private readonly delivery: DeliveryService,
  ) {}
  findByOrderId(orderId: string) {
    return this.repository.findByOrderId(orderId);
  }

  async expire(paymentId: number) {
    const payment = await this.repository.findById(paymentId);
    if (!payment) throw new Error();
    if (payment.status !== 'pending') throw new Error();
    if (payment.method === 'wallet') throw new Error();

    await this.onFailed(
      payment.id,
      payment.orderId,
      payment.method!,
      payment.customerId!,
      'expired',
    );
  }

  async verify(paymentId: number): Promise<TicketStatus> {
    return this.synchronizer.executeExclusive(
      `payment:verify:${paymentId}`,
      async () => {
        const payment = await this.repository.findById(paymentId);
        if (!payment) throw new Error();
        if (payment.status !== 'processing') throw new Error();
        if (payment.method === 'wallet') throw new Error();

        const gateway = this.gateways.resolve(payment.gatewayKey!);
        const status = await gateway.verifyPaymentTicket(
          payment.id,
          payment.trackingCode!,
        );

        switch (status) {
          case 'verified':
          case 'verified-before':
            await this.onPaid(payment.id, payment.orderId);
            break;
          case 'pending':
            break;
          case 'expired':
            await this.onFailed(
              payment.id,
              payment.orderId,
              payment.method!,
              payment.customerId!,
              'expired',
            );
            break;
          default:
            await this.onFailed(
              payment.id,
              payment.orderId,
              payment.method!,
              payment.customerId!,
              'failure',
            );
        }

        return status;
      },
    );
  }

  /** Payment and its order side effects commit or roll back together. */
  private async onPaid(paymentId: number, orderId: string) {
    await this.tx.run(async () => {
      await this.repository.updateStatus(paymentId, { status: 'paid' });
      await this.fulfillment.fulfill({ orderId: orderId });
    });
  }

  private async onFailed(
    paymentId: number,
    orderId: string,
    method: PaymentMethod,
    customerId: string,
    status: 'expired' | 'failure',
    allocation?: { walletAmount?: number },
  ) {
    await this.tx.run(async () => {
      await this.repository.updateStatus(paymentId, { status });

      if (method.method === 'partial' && allocation?.walletAmount) {
        await this.wallet.deposit({
          amount: allocation.walletAmount,
          customerId: customerId,
          reason: 'refund',
          idempotencyKey: `payment:expiration:${orderId}`,
        });
      }

      await this.delivery.cancelDelivery(orderId);
    });
  }

  async cancel(paymentId: number) {
    const payment = await this.repository.findById(paymentId);
    if (!payment) throw new Error();
    if (payment.status !== 'processing') throw new Error();
    if (payment.method === 'wallet') throw new Error();

    await this.repository.updateStatus(paymentId, { status: 'pending' });
    if (payment.method === 'partial')
      await this.wallet.deposit({
        amount: payment.walletAmount!,
        customerId: payment.customerId!,
        reason: 'refund',
        idempotencyKey: `payment:expiration:${payment.orderId}`,
      });
  }

  async settle<T extends PaymentMethod>(
    req: SettleRequest<T>,
  ): Promise<SettleResponse> {
    return await this.synchronizer.executeExclusive(
      `payment:settle:${req.sessionId}`,
      async () => {
        const payment = await this.repository.findById(req.sessionId);
        if (!payment) throw new Error();
        if (payment.status !== 'pending') throw new Error();

        const allocation = await this.allocatePayment({
          amount: payment.amount,
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
          case 'gateway': {
            if (!req.gatewayKey) throw new Error();

            const gateway = this.gateways.resolve(req.gatewayKey);
            const expireAt = new Date();
            expireAt.setMinutes(
              expireAt.getMinutes() +
                gateway.expiryInMinutes +
                gateway.verificationDeadlineInMinutes,
            );

            await this.job.update(session.expiryJob.id, expireAt);

            const { paymentUrl, ticketId } = await gateway.createPaymentTicket({
              providerId: session.sessionId,
              customerContact: session.customer.contact,
              purchasedItems: session.purchasedItems,
              amount:
                allocation.kind === 'partial'
                  ? allocation.gatewayAmount
                  : allocation.amount,
            });

            return await this.tx.run(async () => {
              await this.repository.updatePaymentStatusTo<'pending'>({
                sessionId: session.sessionId,
                expiryJob: session.expiryJob,
                trackingCode: ticketId,
                status: 'pending',
                allocation: allocation as PaymentAllocation<'gateway'>,
                gatewayKey: req.gatewayKey,
                method: req.method,
              });

              return {
                payment: {
                  sessionId: session.sessionId,
                  status: 'pending',
                  allocation: allocation as PaymentAllocation<'gateway'>,
                  gatewayKey: req.gatewayKey,
                  method: req.method,
                  trackingCode: ticketId,
                },
                paymentUrl,
              };
            });
          }

          case 'partial': {
            await this.wallet.withdraw({
              amount: (allocation as PaymentAllocation<'partial'>).walletAmount,
              customerId: req.customerId,
              reason: 'payment',
              referenceId: session.orderId,
              idempotencyKey: `order-payment:${session.orderId}`,
            });
            if (!req.gatewayKey) throw new Error();

            const gateway = this.gateways.resolve(req.gatewayKey);
            if (!gateway.supportsPartialPayment) throw new Error();

            const expireAt = new Date();
            expireAt.setMinutes(
              expireAt.getMinutes() +
                gateway.expiryInMinutes +
                gateway.verificationDeadlineInMinutes,
            );

            await this.job.update(session.expiryJob.id, expireAt);

            const { paymentUrl, ticketId } = await gateway.createPaymentTicket({
              providerId: session.sessionId,
              customerContact: session.customer.contact,
              purchasedItems: session.purchasedItems,
              amount:
                allocation.kind === 'partial'
                  ? allocation.gatewayAmount
                  : allocation.amount,
            });

            return await this.tx.run(async () => {
              await this.repository.updatePaymentStatusTo<'pending'>({
                sessionId: session.sessionId,
                expiryJob: session.expiryJob,
                trackingCode: ticketId,
                status: 'pending',
                allocation: allocation as PaymentAllocation<'partial'>,
                gatewayKey: req.gatewayKey,
                method: req.method,
              });

              return {
                payment: {
                  sessionId: session.sessionId,
                  status: 'pending',
                  allocation: allocation as PaymentAllocation<'partial'>,
                  gatewayKey: req.gatewayKey,
                  method: req.method,
                  trackingCode: ticketId,
                },
                paymentUrl,
              };
            });
          }
          default:
            throw new Error('Unhandled payment method');
        }
      },
    );
  }

  async refund(req: RefundRequest): Promise<void> {
    const { sessionId, customerId } = req;
    const session = await this.repository.findById(sessionId);
    if (!session) throw new Error();
    if (session.status !== 'paid') throw new Error();

    // None full refund amount
    if (req.type === 'partial') {
      await this.tx.run(async () => {
        await this.wallet.deposit({
          amount: req.amount, // total amount to refund into wallet
          customerId,
          reason: 'refund',
          referenceId: session.orderId,
          idempotencyKey: `payment:refunded-order-payment:${session.orderId}`,
        });
        await this.repository.updatePaymentStatusTo<'refunded'>({
          ...session,
          type: 'partial',
          refundedAt: new Date(),
          destination: 'wallet',
          refundedAmount: req.amount,
          status: 'refunded',
        });
      });
      return;
    }

    switch (session.method) {
      case 'partial': {
        const gateway = this.gateways.resolve(session.gatewayKey);
        const { result } = await gateway.refundPaymentTicket({
          providerId: sessionId,
          ticketId: session.trackingCode,
        });

        if (result === 'refunded') {
          await this.tx.run(async () => {
            await this.wallet.deposit({
              amount: session.allocation.walletAmount,
              customerId,
              reason: 'refund',
              referenceId: session.orderId,
              idempotencyKey: `payment:refunded-order-payment:${session.orderId}`,
            });
            await this.repository.updatePaymentStatusTo<'refunded'>({
              ...session,
              refundedAt: new Date(),
              type: 'full',
              destination: 'partial',
              ...session.allocation,
              status: 'refunded',
            });
          });
          break;
        }
      }
      /**
       * this case is also merged to partial if can be refunded the partial gatewayAmount with gateway
       */
      case 'wallet': {
        await this.tx.run(async () => {
          await this.wallet.deposit({
            amount: session.amount, // total amount to refund into wallet
            customerId,
            reason: 'refund',
            referenceId: session.orderId,
            idempotencyKey: `payment:refunded-order-payment:${session.orderId}`,
          });
          await this.repository.updatePaymentStatusTo<'refunded'>({
            ...session,
            refundedAt: new Date(),
            type: 'full',
            destination: 'wallet',
            status: 'refunded',
          });
        });
        break;
      }
      case 'gateway': {
        const gateway = this.gateways.resolve(session.gatewayKey);
        const { result } = await gateway.refundPaymentTicket({
          providerId: sessionId,
          ticketId: session.trackingCode,
        });

        if (result === 'refunded') {
          const data = {
            ...session,
            refundedAt: new Date(),
            type: 'full',
            destination: 'gateway',
            status: 'refunded',
          } satisfies Extract<Payment, { status: 'refunded' }>;
          await this.repository.updatePaymentStatusTo<'refunded'>(data);
          break;
        }

        await this.tx.run(async () => {
          await this.wallet.deposit({
            amount: session.allocation.amount,
            customerId,
            reason: 'refund',
            referenceId: session.orderId,
            idempotencyKey: `order-refunded:${session.orderId}`,
          });

          await this.repository.updatePaymentStatusTo<'refunded'>({
            ...session,
            refundedAt: new Date(),
            type: 'full',
            destination: 'wallet',
            status: 'refunded',
          });
        });
      }
    }
  }

  private async allocatePayment({
    amount,
    customerId,
    walletUsage,
  }: {
    amount: number;
    customerId: string;
    walletUsage?: WalletUsage;
  }): Promise<PaymentAllocation<PaymentMethod>> {
    let walletAmount = 0;

    if (walletUsage) {
      if (walletUsage.mode === 'full') {
        walletAmount = Math.min(balance.available, amount);
      } else {
        if (walletUsage.amount.lte(Money.zero())) {
          throw new InvalidWalletPaymentAmountError(walletUsage.amount);
        }

        if (walletUsage.amount.gt(amount)) {
          throw new Error(`
            walletUsage.amount,
            amount,
            `);
        }

        if (balance.available.lt(walletUsage.amount)) {
          throw new Error(`
            customerId,
            walletUsage.amount,
            balance.available,
            `);
        }

        walletAmount = walletUsage.amount;
      }
    }

    const remaining = amount - walletAmount;

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
