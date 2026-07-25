export interface TaxFormulaRepository {
  getFormula(): Promise<string>;
}
