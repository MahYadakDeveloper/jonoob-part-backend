import { Money } from "@feature/common";

export interface IPurchaseDocumentRepository {
  /**
   * @throws {Error} when theres a product even at least one, thats has no price assigned to it
   */
  getLatestPurchasePricesOf(ids: string[]): Promise<Record<string, Money>>;
}
