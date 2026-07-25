import { MediaRef } from "@feature/common";

export interface Fitment {
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
