import { CustomerType } from "@feature/common";

export interface CustomerQuery {
  getType(id): Promise<CustomerType>;
}
