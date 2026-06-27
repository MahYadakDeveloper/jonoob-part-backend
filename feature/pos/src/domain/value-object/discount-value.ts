import { Money } from "./money";
import { Percentage } from "./percentage";

export type DiscountValue =
  | {
      type: "percentage";
      percentage: Percentage;
    }
  | {
      type: "fixed";
      amount: Money;
    };
