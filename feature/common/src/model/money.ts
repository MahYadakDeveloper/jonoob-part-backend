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

  static zero() {
    return new Money(0);
  }

  static min(a: Money, b: Money) {
    return new Money(Math.min(a.value, b.value));
  }

  isZero(): boolean {
    return Money.zero().equals(this);
  }

  add(other: Money) {
    return new Money(other.value + this._value);
  }

  subtract(other: Money) {
    return new Money(this.value - other.value);
  }

  multiply(quantity: number) {
    return new Money(quantity * this._value);
  }

  gte(other: Money): boolean {
    return this.value >= other.value;
  }

  gt(other: Money): boolean {
    return this.value > other.value;
  }

  lte(other: Money): boolean {
    return this.value <= other.value;
  }

  lt(other: Money): boolean {
    return this.value < other.value;
  }

  equals(other: Money): boolean {
    return this.value === other.value;
  }
}
