import { FitmentRequest } from "./fitment.requests";
import { FitmentResponse } from "./fitment.responses";

export interface FitmentApi {
  fitment(request: FitmentRequest): Promise<FitmentResponse>;
  createFitment(): Promise<void>;
  updateFitment(): Promise<void>;
  deleteFitment(): Promise<void>;
}
