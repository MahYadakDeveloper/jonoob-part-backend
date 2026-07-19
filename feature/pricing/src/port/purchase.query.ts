import { LineItems, Money } from "@feature/common";

export type PurchasePrice = {
  id: string;
  price: Money;
};

export interface IPurchaseQuery {
  /**
   *
   */
  find(id: string): Promise<{ id: string; price: Money } | undefined>;

  /**
   *
   */
  findMany(ids: string[]): Promise<LineItems<PurchasePrice>>;
}
