export class InsufficientStockError extends Error {
  constructor(
    private readonly goodsId: string,
    private readonly qty: number,
  ) {
    super(
      `The error occurs due insufficient amount requested ${qty}qty of good with ${goodsId}id`,
    );
    this.name = "InsufficientStockError";
  }
}
