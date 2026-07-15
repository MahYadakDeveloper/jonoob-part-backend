import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { SaleRecordedEvent } from "@feature/sale-api";
import {
  FindApplicableDiscountRequest,
  FindApplicableDiscountResponse,
  FindManyApplicableDiscountRequest,
  FindManyApplicableDiscountResponse,
  IDiscountService,
} from "@feature/discount-api";
import { DiscountRepository } from "./repository/discount.repository";

// Model for defining a collection
type DiscountCollection = {
  // ...
  expire?: Date;
};

// Model for defining a single
type Discount = {
  // ...
  expire?: Date;
};

@Injectable()
export class DiscountService implements IDiscountService {
  constructor(
    private readonly discountUsageRepository: DiscountUsageRepository,
    private readonly discountCampaignRepository: DiscountCampaignRepository,
    private readonly discountRepository: DiscountRepository
  ) {}
  /**
   * Handles the `sale.sale-recorded` domain event.
   *
   * Updates discount usage records after a sale is completed. If the sale contains
   * discounted products, the customer's discount usage is recorded so future
   * eligibility checks can enforce per-customer limits defined by the discount policy.
   */
  @OnEvent("sale.sale-recorded")
  handleSaleRecordedEvent(event: SaleRecordedEvent) {
    // TODO: Consider including the sale snapshot (or at least the required sale data)
    // in the event payload to avoid fetching the sale by its ID.
    // TODO: Process only line items with an applied discount and record the customer's
    // discount usage for each eligible product.

    const {snapshot} = event
    if (!snapshot.header.customerId || !snapshot.summary.discount)
      return;

    const discounted = snapshot.items.transform()
    
  }

  findApplicableDiscount(
    req: FindApplicableDiscountRequest,
  ): Promise<FindApplicableDiscountResponse> {
    throw new Error("Method not implemented.");
  }
  findManyApplicableDiscount(
    req: FindManyApplicableDiscountRequest,
  ): Promise<FindManyApplicableDiscountResponse> {
    throw new Error("Method not implemented.");
  }
}
