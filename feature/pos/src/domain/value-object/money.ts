import * as z from "zod";
export class Money {
  private constructor(private readonly _value: number) {}

  public static create(value: number) {
    z.number().gte(0).parse(value);
    return new Money(value);
  }

  public get value() {
    return this.value;
  }

  add(other: Money) {
    return new Money(other.value + this._value);
  }

  multiply(quantity: number) {
    return new Money(quantity * this._value);
  }
}
