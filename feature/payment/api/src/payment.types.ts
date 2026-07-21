import { Money } from "@feature/common";

export type UseWallet =
  | { mode: "full" }
  | { mode: "partial"; amount: Money };

