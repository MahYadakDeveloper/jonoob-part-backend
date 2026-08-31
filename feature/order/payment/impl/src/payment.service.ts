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
  RefundResponse,
  SettleRequest,
  SettleResponse,
  WalletPaymentExceedsInvoiceError,
  WalletUsage,
  type PaymentApi,
} from '@feature/order-payment-api';
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

  async createPaymentSession(
    req: PaymentSessionCreationRequest,
  ): Promise<{ payment: Extract<Payment, { status: 'initiated' }> }> {
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
          case 'initiated':
            await this.repository.updatePaymentStatusTo<'expired'>({
              ...session,
              status: 'expired',
            });
            await this.outbox.save({
              type: PaymentFailedEventType,
              payload: {
                sessionId: session.sessionId,
              } satisfies PaymentFailedEventPayload,
            });
            break;

          case 'pending': {
            if (session.method === 'wallet') return;

            // verify first
            const gateway = this.gateways.resolve(session.gatewayKey);

            const { status: ticketStatus } = await gateway.verifyPaymentTicket({
              providerId: session.sessionId,
            });
            switch (ticketStatus) {
              case 'verified':
                await this.repository.updatePaymentStatusTo<'paid'>({
                  ...session,
                  status: 'paid',
                  paidAt: new Date(),
                });
                await this.outbox.save({
                  type: PaymentSucceededEventType,
                  payload: {
                    sessionId: session.sessionId,
                  } satisfies PaymentSucceededEventPayload,
                });
                break;
              case 'expired':
                await this.tx.run(async () => {
                  await this.repository.updatePaymentStatusTo<'expired'>({
                    ...session,
                    status: 'expired',
                  });
                  if (session.method === 'partial') {
                    const { transaction } = await this.wallet.getTransactionByRefId({
                      referenceId: session.orderId,
                    });
                    if (transaction.kind === 'withdraw') {
                      await this.wallet.deposit({
                        amount: transaction.amount,
                        customerId: session.customer.id,
                        reason: 'refund',
                        referenceId: session.orderId,
                        idempotencyKey: `payment:expiration:${session.orderId}`,
                      });
                    }
                  }
                  await this.outbox.save({
                    type: PaymentFailedEventType,
                    payload: {
                      sessionId: session.sessionId,
                    } satisfies PaymentFailedEventPayload,
                  });
                });
              default:
                await this.tx.run(async () => {
                  await this.repository.updatePaymentStatusTo<'expired'>({
                    ...session,
                    status: 'expired',
                  });
                  if (session.method === 'partial') {
                    const { transaction } = await this.wallet.getTransactionByRefId({
                      referenceId: session.orderId,
                    });
                    if (transaction.kind === 'withdraw') {
                      await this.wallet.deposit({
                        amount: transaction.amount,
                        customerId: session.customer.id,
                        reason: 'refund',
                        referenceId: session.orderId,
                        idempotencyKey: `payment:expiration:${session.orderId}`,
                      });
                    }
                  }
                  await this.repository.updatePaymentStatusTo<'failure'>({
                    ...session,
                    status: 'failure',
                  });
                  await this.outbox.save({
                    type: PaymentFailedEventType,
                    payload: {
                      sessionId: session.sessionId,
                    } satisfies PaymentFailedEventPayload,
                  });
                });
            }
            break;
          }
        }
      });
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

  async cancel() {
    // [TODO] Only at pending state is cancelable
    // [TODO] refunded if is allocated with
  }

  async settle<T extends PaymentMethod>(req: SettleRequest<T>): Promise<SettleResponse> {
    return await this.synchronizer.executeExclusive(`payment:settle:${req.sessionId}`, async () => {
      const session = await this.repository.findById(req.sessionId);
      if (!session) throw new Error();
      if (session.status !== 'initiated') throw new Error();

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

  async refund({ sessionId, customerId }: RefundRequest): Promise<RefundResponse> {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new Error();
    if (session.status !== 'paid') throw new Error();

    switch (session.method) {
      case 'partial': {
        const gateway = this.gateways.resolve(session.gatewayKey);
        const { result } = await gateway.refundPaymentTicket({
          providerId: sessionId,
          ticketId: session.trackingCode,
        });

        if (result === 'refunded') {
          return await this.tx.run(async () => {
            await this.wallet.deposit({
              amount: session.allocation.walletAmount,
              customerId,
              reason: 'refund',
              referenceId: session.orderId,
              idempotencyKey: `payment:refunded-order-payment:${session.orderId}`,
            });
            const data = {
              ...session,
              refundedAt: new Date(),
              destination: 'partial',
              ...session.allocation,
              status: 'refunded',
            } satisfies Extract<Payment, { status: 'refunded' }>;
            await this.repository.updatePaymentStatusTo<'refunded'>(data);

            return {
              payment: data,
            };
          });
        }
      }
      /**
       * this case is also merged to partial if can be refunded the partial gatewayAmount with gateway
       */
      case 'wallet': {
        return await this.tx.run(async () => {
          await this.wallet.deposit({
            amount: session.amount, // total amount to refund into wallet
            customerId,
            reason: 'refund',
            referenceId: session.orderId,
            idempotencyKey: `payment:refunded-order-payment:${session.orderId}`,
          });
          const data = {
            ...session,
            refundedAt: new Date(),
            destination: 'wallet',
            status: 'refunded',
          } satisfies Extract<Payment, { status: 'refunded' }>;
          await this.repository.updatePaymentStatusTo<'refunded'>(data);

          return {
            payment: data,
          };
        });
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
            destination: 'gateway',
            status: 'refunded',
          } satisfies Extract<Payment, { status: 'refunded' }>;
          await this.repository.updatePaymentStatusTo<'refunded'>(data);

          return {
            payment: data,
          };
        }

        return await this.tx.run(async () => {
          await this.wallet.deposit({
            amount: session.allocation.amount,
            customerId,
            reason: 'refund',
            referenceId: session.orderId,
            idempotencyKey: `order-refunded:${session.orderId}`,
          });
          const data = {
            ...session,
            refundedAt: new Date(),
            destination: 'wallet',
            status: 'refunded',
          } satisfies Extract<Payment, { status: 'refunded' }>;

          await this.repository.updatePaymentStatusTo<'refunded'>(data);
          return {
            payment: data,
          };
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
