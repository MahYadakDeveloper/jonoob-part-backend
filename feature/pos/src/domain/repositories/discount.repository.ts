import { Money } from "domain/value-object/money";
import { ProductId } from "domain/value-object/product-id";

export interface IDiscountRepository {
  getProductsDiscounts(productsIds: ProductId[]): Record<string, Money>;
}
