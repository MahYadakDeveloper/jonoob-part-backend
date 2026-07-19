import {
  AppliedDiscount,
  BaseEventHandler,
  type IEventHandlerRegistry,
  LineItems,
} from "@feature/common";
import {
  SaleRecordedEventPayload,
  SaleRecordedEventType,
} from "@feature/sale-api";
import { Injectable } from "@nestjs/common";
import { type ISynchronizer } from "../ports/synchronizer";
import { type IDiscountUsageRepository } from "../repository/discount-usage.repository";

@Injectable()
export class SaleRecordedEventHandler extends BaseEventHandler<SaleRecordedEventPayload> {
  constructor(
    private readonly evenHandlerRegistry: IEventHandlerRegistry,
    private readonly discountUsageRepository: IDiscountUsageRepository,
  ) {
    super(evenHandlerRegistry, SaleRecordedEventType);
  }

  
  async handle(payload: SaleRecordedEventPayload) {
  }
}
