import { CustomerType } from "@feature/common";

export interface ICustomerQuery {
  getType(id): Promise<CustomerType>;
}
