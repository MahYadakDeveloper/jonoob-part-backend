export interface ITaxFormulaRepository {
  getFormula(): Promise<string>;
}
