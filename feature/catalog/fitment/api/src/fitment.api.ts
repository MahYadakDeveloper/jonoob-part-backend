import { FitmentDto } from "./fitment";

export interface FitmentApi {
  fitment(id: string): Promise<FitmentDto>;
  createFitment(): Promise<void>;
  updateFitment(): Promise<void>;
  deleteFitment(): Promise<void>;
}
