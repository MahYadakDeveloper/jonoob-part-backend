export type PartialBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Partial<Pick<T, K>>
  : never;

export type RequiredBy<T, K extends keyof T> = T extends unknown
  ? Omit<T, K> & Required<Pick<T, K>>
  : never;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OmitPartials<T, Except extends keyof T = never> = Pick<
  T,
  RequiredKeys<T> | Except
>;

export type StrictOmit<T, K extends keyof T> = Omit<T, K>;
