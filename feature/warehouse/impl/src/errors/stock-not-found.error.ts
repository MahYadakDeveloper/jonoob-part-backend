export class StockNotFoundError extends Error {
  constructor(id: string) {
    super(`No stock found for good "${id}".`);
    this.name = 'StockNotFoundError';
  }
}
