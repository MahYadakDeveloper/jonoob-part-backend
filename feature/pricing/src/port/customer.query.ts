import { CustomerType } from "@feature/common";

export interface CustomerQuery {
  getType(customerId: string): Promise<CustomerType>;
}
