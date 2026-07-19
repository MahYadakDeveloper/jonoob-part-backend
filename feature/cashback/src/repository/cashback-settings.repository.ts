import { CustomerType } from "@feature/common";

export type FlatRateVariant = Exclude<CustomerType, "merchant">;
export type CashbackFlatRate =
  | { disabled: true }
  | { disabled: false; rate: number };

export interface ICashbackSettingsRepository {
  getFlatRate(variant: FlatRateVariant): Promise<CashbackFlatRate>;
  updateFlatRate(
    variant: FlatRateVariant,
    flatRate: CashbackFlatRate,
  ): Promise<void>;
}
