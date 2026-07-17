import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  FindApplicableDiscountRequest,
  FindApplicableDiscountResponse,
  FindManyApplicableDiscountRequest,
  FindManyApplicableDiscountResponse,
  IDiscountService,
} from "@feature/discount-api";
import { AppliedDiscount, LineItems } from "@feature/common";
import { type DiscountSpecificRepository } from "./repository/discount-specific.repository";
import { type DiscountCampaignRepository } from "./repository/discount-campaign.repository";
import { type DiscountUsageRepository } from "./repository/discount-usage.repository";
import { DiscountUsage } from "./model/discount-usage";

@Injectable()
export class DiscountService implements IDiscountService {
  constructor(
    private readonly discountUsageRepository: DiscountUsageRepository,
    private readonly discountCampaignRepository: DiscountCampaignRepository,
    private readonly discountSpecificRepository: DiscountSpecificRepository,
  ) {}
  
  findApplicableDiscount(
    req: FindApplicableDiscountRequest,
  ): Promise<FindApplicableDiscountResponse> {
    // TODO: Don't proceed if customer type is `merchant`
    // Note: Discounts are only allowed for (`technician` | `consumer`)s
    throw new Error("Method not implemented.");
  }
  findManyApplicableDiscount(
    req: FindManyApplicableDiscountRequest,
  ): Promise<FindManyApplicableDiscountResponse> {
    // TODO: Don't proceed if customer type is `merchant`
    // Note: Discounts are only allowed for (`technician` | `consumer`)s
    throw new Error("Method not implemented.");
  }
}
