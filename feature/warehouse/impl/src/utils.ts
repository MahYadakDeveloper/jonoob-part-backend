type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OmitPartials<T, Except extends keyof T = never> = Pick<
  T,
  RequiredKeys<T> | Except
>;

type User = {
  id: string;
  name: string;
  age?: number;
  email?: string;
};

type A = OmitPartials<User>;
// { id: string; name: string }

type B = OmitPartials<User, 'email'>;
// { id: string; name: string; email?: string }

type C = OmitPartials<User, 'age' | 'email'>;
// { id: string; name: string; age?: number; email?: string }
