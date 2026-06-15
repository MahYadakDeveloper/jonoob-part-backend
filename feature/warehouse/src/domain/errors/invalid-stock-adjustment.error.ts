export class InvalidStockAdjustmentException extends Error {
  constructor(quantity: number) {
    super(`Adjusting stock with ${quantity} is invalid`);
    this.name = InvalidStockAdjustmentException.name;
  }
}
