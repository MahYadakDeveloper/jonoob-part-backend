import { FindApplicableDiscountRequest } from "./find-applicable-discount.request";
import { FindApplicableDiscountResponse } from "./find-applicable-discount.response";
import { FindApplicableDiscountsRequest } from "./find-applicable-discounts.request";
import { FindApplicableDiscountsResponse } from "./find-applicable-discounts.response";

export interface DiscountService {
  findApplicableDiscount(
    req: FindApplicableDiscountRequest,
  ): Promise<FindApplicableDiscountResponse>;

  findApplicableDiscounts(
    req: FindApplicableDiscountsRequest,
  ): Promise<FindApplicableDiscountsResponse>;

  // findProductDiscountPolicy(req: FindProductDiscountPolicyRequest): Promise<FindProductDiscountPolicyResponse>
}
