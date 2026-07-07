export class InsufficientStockError extends Error {
  constructor(id: string) {
    super(`Insufficient stock of good #${id}`);
  }
}
