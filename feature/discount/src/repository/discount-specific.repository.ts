import { LineItems } from "@feature/common";
import { DiscountSpecific } from "../model/discount-specific";

export interface DiscountSpecificRepository {
  findManyByProductId(ids: string[]): Promise<LineItems<DiscountSpecific>>;
}
