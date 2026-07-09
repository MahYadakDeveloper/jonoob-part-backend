import { Good } from "./good";

export type GoodDetails = Omit<Partial<Good>, "stock">
