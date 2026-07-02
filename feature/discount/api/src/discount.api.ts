import {
  FindApplicableDiscountRequest,
  FindManyApplicableDiscountRequest,
} from "./discount.req";
import {
  FindApplicableDiscountResponse,
  FindManyApplicableDiscountResponse,
} from "./discount.res";

export interface IDiscountService {
  findApplicableDiscount(
    req: FindApplicableDiscountRequest,
  ): Promise<FindApplicableDiscountResponse>;

  findManyApplicableDiscount(
    req: FindManyApplicableDiscountRequest,
  ): Promise<FindManyApplicableDiscountResponse>;

  // findProductDiscountPolicy(req: FindProductDiscountPolicyRequest): Promise<FindProductDiscountPolicyResponse>
}
