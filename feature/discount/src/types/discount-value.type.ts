export type DiscountValue =
  | {
      type: "percentage";
      percentage: number;
    }
  | {
      type: "fixed";
      amount: Money;
    };

