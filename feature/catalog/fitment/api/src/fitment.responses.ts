import { LineItems } from '@feature/common';
import { FitmentDto } from './fitment.dto';

export interface FitmentManyResponse {
  fitments: LineItems<FitmentDto>;
}
export interface FitmentResponse {
  fitment: FitmentDto;
}
