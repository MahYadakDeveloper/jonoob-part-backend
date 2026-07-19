import {
  CashbackReversalPolicy,
  GrantingCashbackRequest,
  GrantingCashbackResponse,
  ICashbackService,
  ReversalCashbackRequest,
  ReversalCashbackResponse,
} from "@feature/cashback-api";
import { Money } from "@feature/common";
import { Injectable } from "@nestjs/common";
import { CashbackReversalNotAllowedError } from "./errors/cashback-reversal-not-allowed.error";
import { type ICustomerQuery } from "./ports/customer.query";
import { type ICashbackSettingsRepository } from "./repository/cashback-settings.repository";

@Injectable()
export class CashbackService implements ICashbackService {
  constructor(
    private readonly customerQuery: ICustomerQuery,
    private readonly cashbackSettingsRepository: ICashbackSettingsRepository,
    private readonly walletService: IWalletService
  ) {}

  /**
   *
   */
  async processCashbackReversal({
    customerId,
    refundAmount,
    granted,
    policy,
  }: ReversalCashbackRequest): Promise<ReversalCashbackResponse> {
    const reversalCashback = this.calculateCashback(
      granted.appliedRate,
      refundAmount,
    );

    switch (policy) {
      case CashbackReversalPolicy.DeductFromRefund: {
        return { payableRefund: refundAmount.subtract(reversalCashback) };
      }
      case CashbackReversalPolicy.ReverseGrantedCashback: {
        await this.revokeCashback(customerId, reversalCashback);
        return { payableRefund: refundAmount };
      }
      default: {
        const _exhaustive: never = policy;
        throw new Error(`Unsupported cashback policy: ${_exhaustive}`);
      }
    }
  }

  private calculateCashback(flatRate: number, amount: Money): Money {
    return amount.multiply(flatRate);
  }

  /**
   *
   */
  async grantCashback({
    customerId,
    purchaseAmount,
  }: GrantingCashbackRequest): Promise<GrantingCashbackResponse> {
    // no cashback for merchant
    // Resolve the flatRate of cashback service
    const customerType = await this.customerQuery.getType(customerId);
    if (customerType === "merchant") {
      throw new CashbackReversalNotAllowedError(customerId);
    }
    const variant = customerType;
    const flatRate = await this.cashbackSettingsRepository.getFlatRate(variant);

    throw new Error("Method not implemented.");
  }

  /**
   *
   * @param customerId
   * @param cashback
   */
  private async revokeCashback(customerId: string, cashback: Money) {}
}
