import { CustomerType } from "@feature/common";

export interface IMarkupPolicyProvider {
  resolve(type: CustomerType): Promise<number>;
}
