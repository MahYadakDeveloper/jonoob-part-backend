import { UnitOfMeasure } from "src";
import { Quantity } from "./quantity";

export type Packaging =
  | {
      type: "Loose";
      unitOfMeasure: UnitOfMeasure;
    }
  | {
      type: "pack";
      quantity: Quantity;
      unitOfMeasure: UnitOfMeasure;
    }
  | {
      type: "carton";
      quantity: Quantity;
      unitOfMeasure: UnitOfMeasure;
    };
