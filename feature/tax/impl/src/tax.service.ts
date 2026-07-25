import {
  TaxApi,
  TaxCalculationRequest,
  TaxCalculationResponse,
} from "@feature/tax-api";
import { TaxFormulaEvaluator } from "tax.evaluator";
import { TaxFormulaRepository } from "tax.repository";

export class TaxService implements TaxApi {
  constructor(
    private readonly taxFormulaRepository: TaxFormulaRepository,
    private readonly taxFormulaEvaluator: TaxFormulaEvaluator,
  ) {}
  async calculateTax(
    request: TaxCalculationRequest,
  ): Promise<TaxCalculationResponse> {
    const expr = await this.taxFormulaRepository.getFormula();
    const tax = this.taxFormulaEvaluator.evaluate(expr, {
      paymentAmount: request.paymentAmount,
    });
    return { tax };
  }
}
