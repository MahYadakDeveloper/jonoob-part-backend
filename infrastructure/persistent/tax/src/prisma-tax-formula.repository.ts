import { ITaxFormulaRepository } from "@feature/tax";
export class PrismaTaxFormulaRepository implements ITaxFormulaRepository {
  getFormula(): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
