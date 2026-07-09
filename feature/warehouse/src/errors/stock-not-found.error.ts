import { Barcode } from "@feature/common";

export class StockNotFoundError extends Error {
  constructor(id: { goodId: string } | { barcode: Barcode }) {
    super(`No stock found for good "${id}".`);
    this.name = "StockNotFoundError";
  }
}
