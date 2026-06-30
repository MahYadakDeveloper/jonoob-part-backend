import { ProductDiscount } from "domain/value-object/discount";
import { ProductId } from "domain/value-object/product-id";

export interface IDiscountRepository {
  getProductsDiscounts(
    productsIds: ProductId[],
  ): Promise<Record<string, ProductDiscount | undefined>>;
}
