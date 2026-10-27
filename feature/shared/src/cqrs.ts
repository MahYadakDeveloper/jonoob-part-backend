declare const derived: unique symbol;
export type Derived = typeof derived;

type AnyMethod = (input: any) => unknown;

export type MethodKeys<S> = {
  [K in keyof S]: S[K] extends AnyMethod ? K : never;
}[keyof S];

export type InputOf<S, M extends MethodKeys<S>> = S[M] extends () => unknown
  ? void
  : S[M] extends (input: infer I) => unknown
    ? I
    : never;

export type OutputOf<S, M extends MethodKeys<S>> = S[M] extends (
  input: never,
) => infer R
  ? R
  : never;

type ResolveOutput<S, M extends MethodKeys<S>, TOut> = [TOut] extends [Derived]
  ? OutputOf<S, M>
  : TOut;

export interface Command<TInput = void, TOutput = Promise<void>> {
  execute(input: TInput): TOutput;
}

export interface Query<TInput = void, TOutput = Promise<unknown>> {
  execute(input: TInput): TOutput;
}

export interface CommandOf<
  S,
  M extends MethodKeys<S>,
  TOut = Derived,
> extends Command<InputOf<S, M>, ResolveOutput<S, M, TOut>> {}

export type CommandsOf<S, TOut = Derived> = {
  readonly [M in MethodKeys<S>]: CommandOf<S, M, TOut>;
};

export interface QueryOf<
  S,
  M extends MethodKeys<S>,
  TOut = Derived,
> extends Query<InputOf<S, M>, ResolveOutput<S, M, TOut>> {}

export type QueriesOf<S, TOut = Derived> = {
  readonly [M in MethodKeys<S>]: QueryOf<S, M, TOut>;
};
