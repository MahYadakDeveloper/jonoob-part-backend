import { Money } from "@feature/common";
import { TaxCalculationRequest } from "./tax.requests";
import { TaxCalculationResponse } from "./tax.responses";

export interface TaxApi {
  calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse>;
}
