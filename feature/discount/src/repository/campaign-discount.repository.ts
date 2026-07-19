import { CampaignDiscountItem } from "../model/discount-campaign";
import { IDiscountRepository } from "./discount.repository";

export interface ICampaignDiscountRepository extends IDiscountRepository<CampaignDiscountItem> {}
