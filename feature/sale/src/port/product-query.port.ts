import { LineItems } from "@feature/common";
import { ProductProjection } from "../model/product-projection";

export interface IProductQuery {
  findMany(ids: string[]): Promise<LineItems<ProductProjection>>;
}
