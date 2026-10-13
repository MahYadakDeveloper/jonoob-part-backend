import { Money } from "@feature/shared";
import { TaxCalculationRequest } from "./tax.requests";
import { TaxCalculationResponse } from "./tax.responses";

export interface TaxApi {
  calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResponse>;
}
