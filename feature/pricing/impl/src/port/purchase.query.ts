import { LeafProductRaw, LineItems, Money } from "@feature/common";

export type PurchasePrice = {
  id: string;
  price: Money;
};

export interface PurchaseQuery {
  /**
   *
   */
  find(
    product: LeafProductRaw,
  ): Promise<{ id: string; price: Money } | undefined>;

  /**
   *
   */
  findMany(products: LeafProductRaw[]): Promise<LineItems<PurchasePrice>>;
}
