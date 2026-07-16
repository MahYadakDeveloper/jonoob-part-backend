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
  /**
   * Handles the `sale.sale-recorded` domain event.
   *
   * Updates discount usage records after a sale is completed. If the sale contains
   * discounted products, the customer's discount usage is recorded so future
   * eligibility checks can enforce per-customer limits defined by the discount policy.
   */
  @OnEvent("sale.sale-recorded")
  async handleSaleRecordedEvent(event: SaleRecordedEvent) {
    // TODO: Consider including the sale snapshot (or at least the required sale data)
    // in the event payload to avoid fetching the sale by its ID.
    // TODO: Process only line items with an applied discount and record the customer's
    // discount usage for each eligible product.

    const { snapshot } = event;
    const { customerId } = snapshot.header;
    if (!customerId || !snapshot.summary.discount) return;

    const discounted = snapshot.items.reduce(
      (discounted, item) => {
        if (!item.discount) return discounted;

        return discounted.set({ ...item.discount, productId: item.productId });
      },
      new LineItems<AppliedDiscount & { productId: string }>(
        (x) => x.productId,
      ),
    );

    const discountCampaigns =
      await this.discountCampaignRepository.findManyByProductId([
        ...discounted.keys(),
      ]);
    const discountSpecifics =
      await this.discountSpecificRepository.findManyByProductId([
        ...discounted.keys(),
      ]);

    const usages = new LineItems<Omit<DiscountUsage, "customerId">>(
      (usage) => usage.discountId,
    );
    for (const item of discounted) {
      const discountCampaign = discountCampaigns.get(item.productId);
      if (discountCampaign) {
        if (discountCampaign.kind === "unlimited") continue;

        usages.set({
          discountId: discountCampaign.id,
          usedQuantity: item.discountedQuantity,
        });
        continue;
      }

      const discountSpecific = discountSpecifics.get(item.productId);
      if (discountSpecific) {
        if (discountSpecific.kind === "unlimited") continue;

        usages.set({
          discountId: discountSpecific.id,
          usedQuantity: item.discountedQuantity,
        });
      }
    }

    // The upsert method going to update if discountId existed otherwise going to create new row
    await this.discountUsageRepository.upsertMany(
      usages.transform(
        (x) => ({ customerId, ...x }),
        (x) => x.discountId,
      ),
    );
  }

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
