import { Price } from "domain/value-object/price";
import { ProductId } from "../value-object/product-id";

export interface IProductsRepository {

  getProductsPrices(ids: ProductId[]): Promise<Price>
}