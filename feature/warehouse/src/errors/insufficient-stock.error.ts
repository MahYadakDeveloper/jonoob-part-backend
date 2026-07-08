export class InsufficientStockError extends Error {
  constructor(goodId: string) {
    super(`Insufficient stock for good ${goodId}`);
    this.name = "InsufficientStockError";
  }
}
