import { MediaRef } from "@feature/media-api";

// dto
export interface FitmentDto {
  make: {
    name: string;
    logo: MediaRef;
  };
  model: string;
  series?: string;
  madeModel?: Date; // Only year
  fuelType?: "petrol" | "dual";
  transmission: "manual" | "auto";
}
