import { LineItems, RawProduct } from "@feature/common";

export interface RawProductsResponse {
  products: LineItems<RawProduct>;
}
