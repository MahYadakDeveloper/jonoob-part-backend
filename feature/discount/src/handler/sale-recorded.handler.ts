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
import { DiscountUsage } from "../model/discount-usage";
import { type DiscountUsageRepository } from "../repository/discount-usage.repository";

@Injectable()
export class SaleRecordedEventHandler extends BaseEventHandler<SaleRecordedEventPayload> {
  constructor(
    private readonly evenHandlerRegistry: IEventHandlerRegistry,
    private readonly discountUsageRepository: DiscountUsageRepository,
  ) {
    super(evenHandlerRegistry, SaleRecordedEventType);
  }

  /**
   * Handles the `sale.sale-recorded` domain event.
   *
   * Updates discount usage records after a sale is completed. If the sale contains
   * discounted products, the customer's discount usage is recorded so future
   * eligibility checks can enforce per-customer limits defined by the discount policy.
   */
  async handle(payload: SaleRecordedEventPayload) {
    const { snapshot } = payload;
    const { customerId } = snapshot.header;
    if (!customerId || !snapshot.summary.discount) return;

    const discounted = snapshot.items.reduce(
      (discounted, item) => {
        if (!item.discount) return discounted;

        return discounted.set(item.discount);
      },
      new LineItems<AppliedDiscount>((x) => x.source.id),
    );

    const usages = new LineItems<Omit<DiscountUsage, "customerId">>(
      (usage) => usage.discountId,
    );

    for (const item of discounted) {
      if (!item.source.isLimited) continue;

      usages.set({
        discountId: item.source.id,
        usedQuantity: item.discountedQuantity,
      });
    }

    // The upsert method going to update if discountId existed otherwise going to create new row
    await this.discountUsageRepository.upsertMany(
      usages.transform(
        (x) => ({ customerId, ...x }),
        (x) => x.discountId,
      ),
    );
  }
}
