import { LineItems } from "@feature/common";
import { DiscountUsage } from "../model/discount-usage";

export interface IDiscountUsageRepository {
  findCustomerUsage(
    customerId: string,
    discountId: string,
  ): Promise<DiscountUsage | null>;
  findDiscountUsages(discountId: string): Promise<LineItems<DiscountUsage>>;
  findCustomerUsages(
    customerId: string,
    discountIds: string[],
  ): Promise<LineItems< DiscountUsage>>;

  findDiscountUsages(
    discountIds: string[],
  ): Promise<LineItems<LineItems<DiscountUsage>>>;
  upsertMany(usages: LineItems<DiscountUsage>): Promise<void>;
}
