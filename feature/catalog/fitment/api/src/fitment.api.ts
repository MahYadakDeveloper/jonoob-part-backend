import { FitmentManyRequest, FitmentRequest } from './fitment.requests';
import { FitmentManyResponse, FitmentResponse } from './fitment.responses';

export interface FitmentApi {
  findById(request: FitmentRequest): Promise<FitmentResponse>;
  findManyByIds(request: FitmentManyRequest): Promise<FitmentManyResponse>;
}
