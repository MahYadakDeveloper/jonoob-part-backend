// dto
export interface FitmentDto {
  make: string;
  model: string;
  series?: string;
  madeModel?: Date; // Only year
  fuelType?: "petrol" | "dual";
  transmission: "manual" | "auto";
}
