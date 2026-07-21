import {
  CalculateCashbackRequest,
  CalculateCashbackResponse,
  CashbackApi,
  CashbackReversalPolicy,
  GrantingCashbackRequest,
  GrantingCashbackResponse,
  ReversalCashbackRequest,
  ReversalCashbackResponse,
} from "@feature/cashback-api";
import {
  GrantedCashback,
  InvoiceItem,
  LineItems,
  Money,
} from "@feature/common";
import { type WalletApi } from "@feature/wallet-api";
import { Injectable } from "@nestjs/common";
import { type CustomerQuery } from "./ports/customer.query";
import { type CashbackSettingsRepository } from "./repository/cashback-settings.repository";
import {
  CashbackAmountChangedError,
  InvalidCashbackRateError,
} from "./cashback.errors";

@Injectable()
export class CashbackService implements CashbackApi {
  constructor(
    private readonly customerQuery: CustomerQuery,
    private readonly cashbackSettings: CashbackSettingsRepository,
    private readonly wallet: WalletApi,
  ) {}

  async calculate({
    customerId,
    purchasedItems,
  }: CalculateCashbackRequest): Promise<CalculateCashbackResponse> {
    return {
      cashback: await this.resolveGrantedCashback(customerId, purchasedItems),
    };
  }

  async grant({
    customerId,
    referenceId,
    purchasedItems,
    expectedCashback,
  }: GrantingCashbackRequest): Promise<GrantingCashbackResponse> {
    const granted = await this.resolveGrantedCashback(
      customerId,
      purchasedItems,
    );

    if (
      expectedCashback.appliedRate !== granted.appliedRate ||
      !expectedCashback.amount.equals(granted.amount)
    ) {
      throw new CashbackAmountChangedError({
        expected: expectedCashback,
        actual: granted,
      });
    }

    if (granted.amount.isZero()) {
      return { grantedCashback: this.emptyCashback() };
    }

    await this.wallet.deposit({
      customerId,
      amount: granted.amount,
      reason: "cashback",
      referenceId,
      idempotencyKey: `cashback:${referenceId}`,
    });

    return {
      grantedCashback: granted,
    };
  }

  async processCashbackReversal({
    customerId,
    refundedItems,
    referenceId,
    granted,
    policy,
  }: ReversalCashbackRequest): Promise<ReversalCashbackResponse> {
    const eligibleRefundAmount =
      this.resolveCashbackEligibleAmount(refundedItems);

    const reversalCashback = this.calculateCashback(
      granted.appliedRate,
      eligibleRefundAmount,
    );

    switch (policy) {
      case CashbackReversalPolicy.DeductFromRefund:
        return {
          kind: "deduct_from_refund",
          deductedAmount: reversalCashback,
        };

      case CashbackReversalPolicy.ReverseGrantedCashback:
        if (!reversalCashback.isZero()) {
          await this.revokeCashback(customerId, referenceId, reversalCashback);
        }
        await this.revokeCashback(customerId, referenceId, reversalCashback);

        return {
          kind: "reversed",
          reversedAmount: reversalCashback,
        };
    }
  }

  private async resolveGrantedCashback(
    customerId: string,
    purchasedItems: LineItems<InvoiceItem>,
  ): Promise<GrantedCashback> {
    const customerType = await this.customerQuery.getType(customerId);

    if (customerType === "merchant") {
      return this.emptyCashback();
    }

    const policy = await this.cashbackSettings.getPolicy(customerType);

    if (!policy.enabled) {
      return this.emptyCashback();
    }

    const eligibleAmount = this.resolveCashbackEligibleAmount(purchasedItems);

    return {
      appliedRate: policy.rate,
      amount: this.calculateCashback(policy.rate, eligibleAmount),
    };
  }

  private resolveCashbackEligibleAmount<
    T extends {
      lineTotal: Money;
      discount?: { totalDiscount: Money };
    },
  >(items: LineItems<T>): Money {
    return items.reduce((total, item) => {
      if (item.discount?.totalDiscount.gt(Money.zero())) return total;
      return total.add(item.lineTotal);
    }, Money.zero());
  }

  private calculateCashback(rate: number, amount: Money): Money {
    if (rate < 0 || rate > 1) {
      throw new InvalidCashbackRateError(rate);
    }

    return amount.multiply(rate);
  }

  private async revokeCashback(
    customerId: string,
    referenceId: string,
    cashback: Money,
  ): Promise<void> {
    await this.wallet.withdraw({
      customerId,
      amount: cashback,
      reason: "cashback_reversal",
      referenceId,
      idempotencyKey: `cashback-reversal:${referenceId}`,
    });
  }

  private emptyCashback(): GrantedCashback {
    return {
      appliedRate: 0,
      amount: Money.zero(),
    };
  }
}
