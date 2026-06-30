import { CustomerType } from "domain/value-object/customer.type";
import { Markup } from "domain/value-object/markup";

export interface IMarkupPolicyProvider {
  resolve(type: CustomerType): Promise<Markup>
}