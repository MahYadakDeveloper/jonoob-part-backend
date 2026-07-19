export class CashbackReversalNotAllowedError extends Error {
  constructor(customerId: string) {
    super(
      `Cashback reversal is not allowed for merchant customer '${customerId}'.`,
    );

    this.name = CashbackReversalNotAllowedError.name;
  }
}