import { Money, Payment } from "@feature/common";
import {
  InsufficientWalletBalanceError,
  InvalidWalletPaymentAmountError,
  PlanPaymentRequest,
  PlanPaymentResponse,
  WalletPaymentExceedsInvoiceError,
  type PaymentApi,
} from "@feature/payment-api";
import { type WalletApi } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentService implements PaymentApi {
  constructor(private readonly wallet: WalletApi) {}

  async planPayment({
    customerId,
    amountDue,
    useWallet,
  }: PlanPaymentRequest): Promise<PlanPaymentResponse> {
    const { balance: balance } = await this.wallet.getBalance({ customerId });

    let walletAmount = Money.zero();

    switch (useWallet) {
      case false:
        walletAmount = Money.zero();
        break;

      default:
        if (useWallet.mode === "full") {
          walletAmount = Money.min(balance.available, amountDue);
          break;
        }

        if (useWallet.amount.lte(Money.zero())) {
          throw new InvalidWalletPaymentAmountError(useWallet.amount);
        }

        if (useWallet.amount.gt(amountDue)) {
          throw new WalletPaymentExceedsInvoiceError(
            useWallet.amount,
            amountDue,
          );
        }

        if (balance.available.lt(useWallet.amount)) {
          throw new InsufficientWalletBalanceError(
            customerId,
            useWallet.amount,
            balance.available,
          );
        }

        walletAmount = useWallet.amount;
        break;
    }

    const remaining = amountDue.subtract(walletAmount);

    const payment: Payment = remaining.isZero()
      ? {
          kind: "wallet",
          walletAmount,
        }
      : walletAmount.isZero()
        ? {
            kind: "external",
            external: {
              method: "posTerminal",
              amount: remaining,
            },
          }
        : {
            kind: "mixed",
            walletAmount,
            external: {
              method: "posTerminal",
              amount: remaining,
            },
          };

    return { payment };
  }
}
