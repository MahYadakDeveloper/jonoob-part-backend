import { Money } from "@feature/common";

export interface TaxFormulaEvaluator {
  evaluate(expr: string, variable: { paymentAmount: Money }): Money;
}
