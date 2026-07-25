import { LineItems, ProductRaw } from "@feature/common";

export interface RawProductsResponse {
  products: LineItems<ProductRaw>;
}
