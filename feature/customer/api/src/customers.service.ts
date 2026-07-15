import { ResolveCustomerTypeRequest } from "./customers.requests";
import { ResolveCustomerTypeResponse } from "./customers.responses";

export interface ICustomersService {
  getCustomerType(
    request: ResolveCustomerTypeRequest,
  ): Promise<ResolveCustomerTypeResponse>;
}

