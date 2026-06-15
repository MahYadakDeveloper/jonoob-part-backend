export class Quantity {
  private constructor(private readonly value: number) {}

  static create = (value: number) => new Quantity(value);

  increase() {}
  decrease = (qty: Quantity) => Quantity.create(this.value - qty.getValue());
  isGreaterThenOrEqualTo(qty: Quantity): boolean {
    return this.value >= qty.value;
  }
  getValue = () => this.value;
}
