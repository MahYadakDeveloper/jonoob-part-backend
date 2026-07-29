import { LineItems } from '@feature/common';
import { FitmentDto } from './fitment.dto';

export interface FindManyFitmentResponse {
  fitments: LineItems<FitmentDto>;
}
export interface FindFitmentResponse {
  fitment: FitmentDto;
}
