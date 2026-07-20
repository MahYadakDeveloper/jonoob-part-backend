import { Money } from "@feature/common";

export type UseWallet =
  | false
  | { mode: "full" }
  | { mode: "partial"; amount: Money };

