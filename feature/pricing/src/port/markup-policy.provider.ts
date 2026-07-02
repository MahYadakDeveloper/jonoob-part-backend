import { PricingPolicy } from "@feature/pricing-api";

export interface IMarkupPolicyProvider {
  resolve(policy: PricingPolicy): Promise<number>;
}
