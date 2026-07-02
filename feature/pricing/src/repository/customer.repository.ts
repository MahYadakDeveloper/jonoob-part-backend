import { CustomerType } from "@feature/common";

export interface ICustomerRepository {
  getCustomerType(id: string): Promise<CustomerType>;
}
