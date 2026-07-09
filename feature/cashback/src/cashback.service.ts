import { ICashbackService } from "@feature/cashback-api";
import { type ICustomersService } from "@feature/customer-api";
import { SaleRecordedEvent } from "@feature/pos-api";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GrantCashbackResponse } from "./cashback.responses";

@Injectable()
export class CashbackService implements ICashbackService {
  constructor(private readonly customersService: ICustomersService

  ) {}

  @OnEvent("pos.sale-recorded")
  async handleSaleRecordedEvent(
    event: SaleRecordedEvent,
  ): Promise<GrantCashbackResponse> {
    
    // Note: If customer type is merchant there is no cashback considered for them.
    const { customerType } = await this.customersService.resolveCustomerType({
      customerId,
    });

    throw new Error("Method not implemented.");
  }

  reverseCashback(): Promise<void> {
    throw new Error("Method not implemented.");
  }


}
