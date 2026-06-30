import { EntityId } from "@feature/shared";
import { CustomerType } from "domain/value-object/customer.type";

export interface ICustomerRepository {
  getCustomerTypeById(customerId: EntityId): CustomerType
}