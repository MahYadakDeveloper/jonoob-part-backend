export interface ITransactionContext<TClient = unknown> {
  current(): TClient | null;

  run<T>(
    client: TClient,
    fn: () => Promise<T>,
  ): Promise<T>;
}