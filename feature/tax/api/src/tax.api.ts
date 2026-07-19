import { Money } from "@feature/common";
import { TaxCalculationRequest } from "./tax.requests";
import { TaxCalculationResponse } from "./tax.responses";

export interface ITaxService {
  calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse>;
}
