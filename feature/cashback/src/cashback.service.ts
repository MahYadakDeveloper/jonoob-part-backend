import {
  CashbackApi,
  CashbackReversalPolicy,
  GrantingCashbackRequest,
  GrantingCashbackResponse,
  ReversalCashbackRequest,
  ReversalCashbackResponse,
} from "@feature/cashback-api";
import { Money } from "@feature/common";
import { type WalletApi } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";
import { type CustomerQuery } from "./ports/customer.query";
import { type CashbackSettingsRepository } from "./repository/cashback-settings.repository";

@Injectable()
export class CashbackService implements CashbackApi {
  constructor(
    private readonly customerQuery: CustomerQuery,
    private readonly cashbackSettings: CashbackSettingsRepository,
    private readonly wallet: WalletApi,
  ) {}

  async grantCashback({
    customerId,
    referenceId,
    purchaseAmount,
  }: GrantingCashbackRequest): Promise<GrantingCashbackResponse> {
    const customerType = await this.customerQuery.getType(customerId);

    // merchants do not receive cashback
    if (customerType === "merchant") {
      return this.noCashback();
    }

    const policy = await this.cashbackSettings.getPolicy(customerType);

    if (!policy.enabled) {
      return this.noCashback();
    }

    const cashback = this.calculateCashback(policy.rate, purchaseAmount);

    await this.wallet.credit({
      customerId,
      amount: cashback,
      reason: "cashback",
      referenceId,
      idempotencyKey: `cashback:${referenceId}`,
    });

    return {
      grantedCashback: {
        appliedRate: policy.rate,
        amount: cashback,
      },
    };
  }

  async processCashbackReversal({
    customerId,
    refundAmount,
    referenceId,
    granted,
    policy,
  }: ReversalCashbackRequest): Promise<ReversalCashbackResponse> {
    const reversalCashback = this.calculateCashback(
      granted.appliedRate,
      refundAmount,
    );

    switch (policy) {
      case CashbackReversalPolicy.DeductFromRefund:
        return {
          payableRefund: refundAmount.subtract(reversalCashback),
        };

      case CashbackReversalPolicy.ReverseGrantedCashback:
        await this.revokeCashback(customerId, referenceId, reversalCashback);

        return { payableRefund: refundAmount };
    }
  }

  private calculateCashback(rate: number, amount: Money): Money {
    return amount.multiply(rate);
  }

  private async revokeCashback(
    customerId: string,
    referenceId: string,
    cashback: Money,
  ): Promise<void> {
    await this.wallet.debit({
      customerId,
      amount: cashback,
      reason: "cashback_reversal",
      referenceId,
      idempotencyKey: `cashback-reversal:${referenceId}`,
    });
  }

  private noCashback(): GrantingCashbackResponse {
    return {
      grantedCashback: {
        appliedRate: 0,
        amount: Money.zero(),
      },
    };
  }
}
