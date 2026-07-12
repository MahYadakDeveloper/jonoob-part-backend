import {
  CashbackReversalPolicy,
  ICashbackService,
  ReversalCashbackRequest,
  ReversalCashbackResponse,
} from "@feature/cashback-api";
import { type ICustomersService } from "@feature/customer-api";
import { SaleRecordedEvent } from "@feature/sale-api";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GrantCashbackResponse } from "./cashback.responses";
import { CustomerType, Money } from "@feature/common";

@Injectable()
export class CashbackService implements ICashbackService {
  constructor(private readonly customersService: ICustomersService) {}

  @OnEvent("pos.sale-recorded")
  async handleSaleRecordedEvent(
    event: SaleRecordedEvent,
  ): Promise<GrantCashbackResponse> {
    
    // Note: If customer type is merchant there is no cashback considered for them.
    const { customerType } = await this.customersService.resolveCustomerType({
      customerId: ,
    });

    throw new Error("Method not implemented.");
  }


  async processCashbackReversal({
    customerId,
    refund,
    policy,
  }: ReversalCashbackRequest): Promise<ReversalCashbackResponse> {
    const { customerType } = await this.customersService.resolveCustomerType({
      customerId,
    });
    const cashback = await this.calculateCashback(customerType, refund);

    switch (policy) {
      case CashbackReversalPolicy.DeductFromRefund: {
        return { payableRefund: refund.subtract(cashback) };
      }
      case CashbackReversalPolicy.ReverseGrantedCashback: {
        await this.revokeCashback(customerId, cashback);
        return { payableRefund: refund };
      }
      default: {
        const _exhaustive: never = policy;
        throw new Error(`Unsupported cashback policy: ${_exhaustive}`);
      }
    }
  }

  private calculateCashback(
    customerType: CustomerType,
    amount: Money,
  ): Promise<Money> {
    throw new Error("Method not implemented.");
  }

  /**
   *
   */
  private async grantCashback(customerId: string, cashback: Money) {}

  /**
   *
   * @param customerId
   * @param cashback
   */
  private async revokeCashback(customerId: string, cashback: Money) {}


}
