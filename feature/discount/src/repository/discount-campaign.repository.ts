import { LineItems } from "@feature/common";
import { DiscountCampaignProduct } from "../model/discount-campaign";

export interface DiscountCampaignRepository {
  findManyById(ids: string[]): Promise<LineItems<DiscountCampaignProduct>>;
}
