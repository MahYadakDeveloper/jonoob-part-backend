import { CustomerType } from "@feature/common";

export interface ICustomersRepository {
  getCustomerTypeById(customerId: string): CustomerType;
}
