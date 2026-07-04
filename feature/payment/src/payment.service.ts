import { Money, Payment } from "@feature/common";
import {
  PlanPaymentRequest,
  PlanPaymentResponse,
  type IPaymentService,
} from "@feature/payment-api";
import { type IWalletService } from "@feature/wallet-api";

export class PaymentService implements IPaymentService {
  constructor(private readonly walletService: IWalletService) {}

  async planPayment(req: PlanPaymentRequest): Promise<PlanPaymentResponse> {
    const { useWallet, amountDue, customerId } = req;
    const { balance } = await this.walletService.getWalletBalance({
      customerId,
    });

    // TODO Complete this ...
    // Verification
    if (useWallet) {
      // ...
      // Throw an error if not verified
    }

    let walletAmount = Money.zero();

    if (!!useWallet && useWallet.wallet instanceof Money) {
      const { wallet } = useWallet;
      if (balance.lt(wallet)) throw new Error("Insufficient balance!");
      if (wallet.gt(amountDue))
        throw new Error("The paying amount is more then expected!");

      walletAmount = wallet;
    } else if (useWallet) {
      walletAmount = Money.min(balance, amountDue);
    }

    const remaining = amountDue.subtract(walletAmount);

    const payment: Payment = remaining.isZero()
      ? {
          paidAmountByBalance: walletAmount,
        }
      : walletAmount.isZero()
        ? {
            externalPayment: {
              paymentMethod: "posTerminal",
              amount: remaining,
            },
          }
        : {
            paidAmountByBalance: walletAmount,
            externalPayment: {
              paymentMethod: "posTerminal",
              amount: remaining,
            },
          };
    return { payment };
  }
}
