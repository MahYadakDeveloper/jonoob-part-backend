import { FindApplicableDiscountRequest } from "./find-applicable-discount.request";
import { FindApplicableDiscountResponse } from "./find-applicable-discount.response";

export interface DiscountService {
  findApplicableDiscount(
    req: FindApplicableDiscountRequest,
  ): Promise<FindApplicableDiscountResponse>;

  // findProductDiscountPolicy(req: FindProductDiscountPolicyRequest): Promise<FindProductDiscountPolicyResponse>
}
