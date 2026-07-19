import { Money } from "@feature/common";
import { type ITaxFormulaEvaluator } from "@feature/tax";
import math from "mathjs";

export class MathjsTaxFormulaEvaluator implements ITaxFormulaEvaluator {
  private readonly parser = math.parser();

  evaluate(
    expr: string,
    variables: {
      paymentAmount: Money;
    },
  ): Money {
    this.parser.clear();

    this.parser.set("paymentAmount", variables.paymentAmount.value);

    const result = this.parser.evaluate(expr);

    if (typeof result !== "number" || !Number.isFinite(result)) {
      throw new Error("Tax formula must evaluate to a finite number.");
    }

    return Money.create(result);
  }
}
