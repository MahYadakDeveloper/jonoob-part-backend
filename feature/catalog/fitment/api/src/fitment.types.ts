import { MediaRef } from '@feature/common';

export interface Fitment {
  make: {
    name: string;
    logo: MediaRef;
  };
  model: string;
  series?: string;
  modelYearRange?: {
    from?: number;
    to?: number;
  };
  fuelType?: string;
  transmission?: string;
}
