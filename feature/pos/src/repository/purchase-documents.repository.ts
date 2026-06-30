import { Money } from "domain/value-object/money";
import { ProductId } from "../value-object/product-id";

export interface IPurchaseDocumentRepository {
  /**
   * @throws {Error} when theres a product even at least one, thats has no price assigned to it
   */
  getLatestPurchasePricesOf(ids: ProductId[]): Promise<Record<string, Money>>;
}
