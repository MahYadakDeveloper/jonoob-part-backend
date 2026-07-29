import { FindFitmentRequest, FindManyFitmentRequest } from './fitment.requests';
import { FindFitmentResponse, FindManyFitmentResponse } from './fitment.responses';

export interface FitmentApi {
  findOne(request: FindFitmentRequest): Promise<FindFitmentResponse>;
  findMany(request: FindManyFitmentRequest): Promise<FindManyFitmentResponse>;
}
