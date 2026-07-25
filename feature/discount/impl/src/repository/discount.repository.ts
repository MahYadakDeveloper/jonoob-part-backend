import { LineItems } from "@feature/common";

export interface DiscountRepository<T> {
  findManyByIds(discountIds: string[]): Promise<LineItems<T>>;
  findByProductId(productId: string): Promise<T | undefined>;
  findManyByProductIds(productIds: string[]): Promise<LineItems<T>>;
}
