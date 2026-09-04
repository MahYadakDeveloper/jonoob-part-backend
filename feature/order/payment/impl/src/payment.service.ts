import {
  addDuration,
  Duration,
  Money,
  SettingToken,
  type JobScheduler,
  type OutboxRepository,
  type SettingsStore,
  type Synchronizer,
  type TransactionManager,
} from '@feature/common';
import { type WalletApi } from '@feature/customer-wallet-api';
import {
  InsufficientWalletBalanceError,
  InvalidWalletPaymentAmountError,
  Payment,
  PaymentAllocation,
  PaymentFailedEventPayload,
  PaymentFailedEventType,
  PaymentMethod,
  PaymentSessionCreationRequest,
  PaymentSucceededEventPayload,
  PaymentSucceededEventType,
  RefundRequest,
  SettleRequest,
  SettleResponse,
  WalletPaymentExceedsInvoiceError,
  WalletUsage,
  type PaymentApi,
} from '@feature/order-payment-api';
import { TicketStatus } from '@feature/order-payment-gateway-api';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
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
  private static readonly PaymentSettings: SettingToken<{ expiry: Duration }> = {
    key: 'payment',
    defaultValue: {
      expiry: {
        value: 10,
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
    private readonly gateways: PaymentGatewayResolver,
    private readonly tx: TransactionManager,
    private readonly settings: SettingsStore,
    private readonly job: JobScheduler,
    private readonly outbox: OutboxRepository,
    private readonly synchronizer: Synchronizer,
  ) {}

  async initialize(req: PaymentSessionCreationRequest): Promise<void> {
    const total = req.purchasedItems.reduce(
      (acc, item) => acc.add(item.unitPrice.multiply(item.quantity)),
      Money.zero(),
    );
    if (!total.equals(req.amount)) throw new Error();

    const { expiry } = await this.settings.get(PaymentService.PaymentSettings);
    const expiresAt = addDuration(new Date(), expiry);

    const handle = await this.job.schedule(expiresAt, async () => {
      const session = await this.repository.findByOrderId(req.orderId);
      if (!session) return;

      await this.tx.run(async () => {
        switch (session.status) {
          case 'initial':
            await this.repository.updatePaymentStatusTo<'expired'>({
              ...session,
              status: 'expired',
            });
            await this.outbox.save({
              type: PaymentFailedEventType,
              payload: {
                orderId: session.orderId,
              } satisfies PaymentFailedEventPayload,
            });
            break;

          case 'pending': {
            if (session.method === 'wallet') return;

            // verify first
            const gateway = this.gateways.resolve(session.gatewayKey);

            const { status: ticketStatus } = await gateway.getTicketStatus({
              ticketId: session.trackingCode,
            });

            switch (ticketStatus) {
              case 'expired':
                await this.tx.run(async () => {
                  await this.repository.updatePaymentStatusTo<'expired'>({
                    ...session,
                    status: 'expired',
                  });
                  if (session.method === 'partial') {
                    await this.wallet.deposit({
                      amount: session.allocation.walletAmount,
                      customerId: session.customer.id,
                      reason: 'refund',
                      referenceId: session.orderId,
                      idempotencyKey: `payment:expiration:${session.orderId}`,
                    });
                  }
                  await this.outbox.save({
                    type: PaymentFailedEventType,
                    payload: {
                      orderId: session.orderId,
                    } satisfies PaymentFailedEventPayload,
                  });
                });
                break;
              default:
                await this.tx.run(async () => {
                  await this.repository.updatePaymentStatusTo<'expired'>({
                    ...session,
                    status: 'expired',
                  });
                  if (session.method === 'partial') {
                    await this.wallet.deposit({
                      amount: session.allocation.walletAmount,
                      customerId: session.customer.id,
                      reason: 'refund',
                      referenceId: session.orderId,
                      idempotencyKey: `payment:expiration:${session.orderId}`,
                    });
                  }
                  await this.repository.updatePaymentStatusTo<'failure'>({
                    ...session,
                    status: 'failure',
                  });
                  await this.outbox.save({
                    type: PaymentFailedEventType,
                    payload: {
                      orderId: session.orderId,
                    } satisfies PaymentFailedEventPayload,
                  });
                });
            }
            break;
          }
        }
      });
    });

    await this.repository.create({
      ...req,
      status: 'initial',
      expiryJob: handle,
    });
  }

  async verify({ sessionId }: { sessionId: number }): Promise<{ status: TicketStatus }> {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new Error();
    if (session.status !== 'pending') throw new Error();
    if (session.method === 'wallet') throw new Error();

    const gateway = this.gateways.resolve(session.gatewayKey);
    const { status } = await gateway.verifyPaymentTicket({
      providerId: session.sessionId,
      ticketId: session.trackingCode,
    });

    switch (status) {
      case 'verified':
        await this.tx.run(async () => {
          await this.repository.updatePaymentStatusTo<'paid'>({
            ...session,
            status: 'paid',
            paidAt: new Date(),
          });

          await this.outbox.save({
            type: PaymentSucceededEventType,
            payload: {
              orderId: session.orderId,
            } satisfies PaymentSucceededEventPayload,
          });
        });
        break;
      case 'pending':
        break;
      case 'expired':
        await this.repository.updatePaymentStatusTo<'expired'>({
          ...session,
          status: 'expired',
        });
        await this.outbox.save({
          type: PaymentFailedEventType,
          payload: {
            orderId: session.orderId,
          } satisfies PaymentFailedEventPayload,
        });
        break;
      default:
        await this.repository.updatePaymentStatusTo<'failure'>({
          ...session,
          status: 'failure',
        });
        await this.outbox.save({
          type: PaymentFailedEventType,
          payload: {
            orderId: session.orderId,
          } satisfies PaymentFailedEventPayload,
        });
    }

    return {
      status,
    };
  }

  /**
   * [TODO] Apply authorization for customer who belongs to the payment session
   */
  async cancel({ sessionId }: { sessionId: number }) {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new Error();
    if (session.status !== 'pending') throw new Error();
    if (session.method === 'wallet') throw new Error();

    switch (session.method) {
      case 'partial':
        {
          await this.repository.updatePaymentStatusTo<'initial'>({
            sessionId,
            status: 'initial',
          });
          await this.wallet.deposit({
            amount: session.allocation.walletAmount,
            customerId: session.customer.id,
            reason: 'refund',
            referenceId: session.orderId,
            idempotencyKey: `payment:expiration:${session.orderId}`,
          });
        }
        break;
      case 'gateway': {
        await this.repository.updatePaymentStatusTo<'initial'>({
          sessionId,
          status: 'initial',
        });
        return;
      }
    }
  }

  async settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse> {
    return await this.synchronizer.executeExclusive(`payment:settle:${req.sessionId}`, async () => {
      const session = await this.repository.findById(req.sessionId);
      if (!session) throw new Error();
      if (session.status !== 'initial') throw new Error();

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
        case 'gateway': {
          if (!req.gatewayKey) throw new Error();

          const gateway = this.gateways.resolve(req.gatewayKey);
          const expireAt = new Date();
          expireAt.setMinutes(
            expireAt.getMinutes() + gateway.expiryInMinutes + gateway.verificationDeadlineInMinutes,
          );

          await this.job.update(session.expiryJob.id, expireAt);

          const { paymentUrl, ticketId } = await gateway.createPaymentTicket({
            providerId: session.sessionId,
            customerContact: session.customer.contact,
            purchasedItems: session.purchasedItems,
            amount: allocation.kind === 'partial' ? allocation.gatewayAmount : allocation.amount,
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
            expireAt.getMinutes() + gateway.expiryInMinutes + gateway.verificationDeadlineInMinutes,
          );

          await this.job.update(session.expiryJob.id, expireAt);

          const { paymentUrl, ticketId } = await gateway.createPaymentTicket({
            providerId: session.sessionId,
            customerContact: session.customer.contact,
            purchasedItems: session.purchasedItems,
            amount: allocation.kind === 'partial' ? allocation.gatewayAmount : allocation.amount,
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
    });
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
