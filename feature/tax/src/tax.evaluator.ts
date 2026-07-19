import { Money } from "@feature/common";

export interface ITaxFormulaEvaluator {
  evaluate(expr: string, variable: { paymentAmount: Money }): Money;
}
