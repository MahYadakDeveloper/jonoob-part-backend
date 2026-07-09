import { ResolveCustomerTypeRequest } from "./customers.requests";
import { ResolveCustomerTypeResponse } from "./customers.responses";

export interface ICustomersService {
  resolveCustomerType(
    request: ResolveCustomerTypeRequest,
  ): Promise<ResolveCustomerTypeResponse>;
}

