import { CustomerType } from "@feature/common";

export interface ICustomerQuery {
  getType(customerId: string): Promise<CustomerType>;
}
