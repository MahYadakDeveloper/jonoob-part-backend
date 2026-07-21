import { TaxFormulaRepository } from "@feature/tax";
export class PrismaTaxFormulaRepository implements TaxFormulaRepository {
  getFormula(): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
