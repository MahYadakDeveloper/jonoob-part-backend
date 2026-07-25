import { PricingPolicy } from "@feature/common";

export interface MarkupPolicyProvider {
  resolve(policy: PricingPolicy): Promise<number>;
}
