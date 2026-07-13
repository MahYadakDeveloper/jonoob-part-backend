import { ProductProjection } from "../model/product-projection";

export interface IProductQuery {
  findMany(ids: string[]): Promise<ProductProjection>;
}
