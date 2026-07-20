import { LineItems } from "@feature/common";
import { ProductProjection } from "../model/product-projection";

export interface ProductQuery {
  findMany(ids: string[]): Promise<LineItems<ProductProjection>>;
}
