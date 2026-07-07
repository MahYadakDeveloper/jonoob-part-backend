import { Cache } from "@infra/common-persistent";

export type Stock = number;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WarehouseCache extends Cache<Stock> {}
