import { ResolvePricingPolicyRequest } from "./customers.requests";
import { ResolvePricingPolicyResponse } from "./customers.responses";

export interface ICustomersService {
  resolvePricingPolicy(
    request: ResolvePricingPolicyRequest,
  ): Promise<ResolvePricingPolicyResponse>;
}
