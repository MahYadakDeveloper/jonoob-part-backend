// type AnyMethod = (input: any) => Promise<any>;

// export type MethodKeys<A> = {
//   [K in keyof A]: A[K] extends AnyMethod ? K : never;
// }[keyof A];

// export type ApiInput<A, M extends MethodKeys<A>> = A[M] extends (
//   input: infer I,
// ) => unknown
//   ? I
//   : never;

// export type ApiOutput<A, M extends MethodKeys<A>> = A[M] extends (
//   input: never,
// ) => Promise<infer O>
//   ? O
//   : never;

// export type ApiCommands<A> = {
//   readonly [M in MethodKeys<A>]: ApiCommand<ApiInput<A, M>, ApiOutput<A, M>>;
// };

// export interface Command<TInput = void, TOutput = void> {
//   execute(input: TInput): Promise<TOutput>;
// }

// export interface ApiCommand<A, M extends MethodKeys<A>> extends Command<
//   ApiInput<A, M>,
//   ApiOutput<A, M>
// > {}

// export type Commands<A> = {
//   [M in MethodKeys<A>]: Command<ApiInput<A, M>, ApiOutput<A, M>>;
// };

type AnyMethod = (input: any) => Promise<any>;

export type MethodKeys<A> = {
  [K in keyof A]: A[K] extends AnyMethod ? K : never;
}[keyof A];

export type ApiInput<
  A,
  M extends MethodKeys<A>,
> = A[M] extends () => Promise<unknown>
  ? void
  : A[M] extends (input: infer I) => Promise<unknown>
    ? I
    : never;

export type ApiOutput<A, M extends MethodKeys<A>> = A[M] extends (
  input: never,
) => Promise<infer O>
  ? O
  : never;

export interface Command<TInput = void, TOutput = void> {
  execute(input: TInput): Promise<TOutput>;
}

export interface ApiCommand<A, M extends MethodKeys<A>> extends Command<
  ApiInput<A, M>,
  ApiOutput<A, M>
> {}

export type ApiCommands<A> = {
  readonly [M in MethodKeys<A>]: ApiCommand<A, M>;
};
