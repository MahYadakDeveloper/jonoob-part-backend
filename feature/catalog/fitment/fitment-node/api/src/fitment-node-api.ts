import { FindFitmentNodeRequest, FindManyFitmentNodeRequest } from './fitment-node.req';
import { FindFitmentNodeResponse, FindManyFitmentNodeResponse } from './fitment-node.res';

export interface FitmentNodeApi {
  find(req: FindFitmentNodeRequest): Promise<FindFitmentNodeResponse>;
  findMany(req: FindManyFitmentNodeRequest): Promise<FindManyFitmentNodeResponse>;
}
