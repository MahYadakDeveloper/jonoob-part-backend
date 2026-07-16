import { LineItems } from "@feature/common";
import {
    DiscountCampaignProduct
} from "../model/discount-campaign";

export interface DiscountCampaignRepository {
  findManyByProductId(ids: string[]): Promise<LineItems<DiscountCampaignProduct>>;
}
