import { SpecificDiscount } from "../model/specific-discount";
import { IDiscountRepository } from "./discount.repository";

export interface ISpecificDiscountRepository extends IDiscountRepository<SpecificDiscount> {}
