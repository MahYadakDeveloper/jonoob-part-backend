import { Money, Payment } from '@feature/common';
import {
  InsufficientWalletBalanceError,
  InvalidWalletPaymentAmountError,
  PaymentSessionCreationRequest,
  PayRequest,
  PayResponse,
  PlanPaymentRequest,
  PlanPaymentResponse,
  WalletPaymentExceedsInvoiceError,
  type PaymentApi,
} from '@feature/payment-api';
import { type PaymentGatewayApi } from '@feature/payment-gateway-api';
import { type WalletApi } from '@feature/wallet-api';
import { Injectable } from '@nestjs/common';

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
    private readonly sessions: PaymentSessionStore,
    private readonly gateways: PaymentGatewayApi[],
  ) {}

  pay({ paymentSessionId, provider }: PayRequest): Promise<PayResponse> {
    const gateway = this.gateways.find((g) => g.provider === provider);
    if (!gateway) throw new Error('Invalid provider');

    throw new Error('Method not implemented.');
  }

  async createPaymentSession({
    orderId,
    customerId,
  }: PaymentSessionCreationRequest): Promise<void> {}

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
