export interface DbProvider<TClient = unknown> {
  current(): TClient;
}

export abstract class BaseRepository<TClient> {
  constructor(protected readonly dbProvider: DbProvider<TClient>) {}

  protected get db(): TClient {
    return this.dbProvider.current();
  }
}
