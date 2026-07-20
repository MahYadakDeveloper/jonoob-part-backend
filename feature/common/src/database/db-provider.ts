export interface DbProvider<TClient = unknown> {
  current();
}