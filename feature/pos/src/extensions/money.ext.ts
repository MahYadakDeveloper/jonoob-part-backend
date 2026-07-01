import { Money } from "model/money";

declare module "model/money" {
  interface Money {
    sum(other: Money): Money;
  }
}

Money.prototype.sum = function (other: Money): Money {
  return new Money(this.value);
};
