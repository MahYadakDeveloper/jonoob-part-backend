export class StockNotFoundError extends Error {
  constructor(goodId: string) {
    super(`No stock found for good "${goodId}".`);
    this.name = "StockNotFoundError";
  }
}
