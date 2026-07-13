export type PartialBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Partial<Pick<T, K>>
  : never;

export type RequiredBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Required<Pick<T, K>>
  : never;
