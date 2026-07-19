import {
  ITaxService,
  TaxCalculationRequest,
  TaxCalculationResponse,
} from "@feature/tax-api";
import { ITaxFormulaEvaluator } from "tax.evaluator";
import { ITaxFormulaRepository } from "tax.repository";

export class TaxService implements ITaxService {
  constructor(
    private readonly taxFormulaRepository: ITaxFormulaRepository,
    private readonly taxFormulaEvaluator: ITaxFormulaEvaluator,
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
