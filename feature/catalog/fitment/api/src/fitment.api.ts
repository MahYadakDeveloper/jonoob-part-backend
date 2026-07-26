import { FitmentRequest } from './fitment.requests';
import { FitmentResponse } from './fitment.responses';

export interface FitmentApi {
  findById(request: FitmentRequest): Promise<FitmentResponse>;
}
