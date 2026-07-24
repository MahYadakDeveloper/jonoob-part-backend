import { FitmentDto } from "./fitment";

export interface FitmentApi {
  fitment(id: string): Promise<FitmentDto>;
}
