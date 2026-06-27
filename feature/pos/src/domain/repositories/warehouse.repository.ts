import { Quantity, UnitOfMeasure } from "@feature/shared";
import { ProductId } from "domain/value-object/product-id";

export interface IWarehouseRepository {
  checkAvailableStocks(products: Record<string, Quantity>): Promise<void>;
  getUnitOfMeasuresByIds(
    ids: ProductId[],
  ): Promise<Record<string, UnitOfMeasure>>;
}
