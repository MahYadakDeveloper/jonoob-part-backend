import { Money } from "@feature/shared";

export interface TaxFormulaEvaluator {
  evaluate(expr: string, variable: { paymentAmount: Money }): Money;
}
