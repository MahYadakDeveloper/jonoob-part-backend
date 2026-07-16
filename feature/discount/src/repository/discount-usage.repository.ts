import { LineItems } from "@feature/common";
import { DiscountUsage } from "../model/discount-usage";

export interface DiscountUsageRepository {
  upsertMany(usages: LineItems<DiscountUsage>): Promise<void>;
}
