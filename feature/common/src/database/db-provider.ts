export interface IDbProvider<TClient = unknown> {
  current();
}