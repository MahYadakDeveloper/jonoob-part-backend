import { LineItems, Money } from "@feature/common";

export interface IPurchaseQuerier {
  /**
   *
   */
  find(id: string): Promise<{ id: string; price: Money } | undefined>;

  /**
   *
   */
  findMany(ids: string[]): Promise<LineItems<{ id: string; price: Money }>>;
}
