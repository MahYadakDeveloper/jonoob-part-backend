import { FindOrderByIdRequest } from './order.req';
import { FindOrderByIdResponse } from './order.res';

export interface OrderApi {
  findById(req: FindOrderByIdRequest): Promise<FindOrderByIdResponse>;
}
