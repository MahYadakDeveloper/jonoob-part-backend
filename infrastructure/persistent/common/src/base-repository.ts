import { IDbProvider } from "@feature/common";

export abstract class BaseRepository<TClient> {
  constructor(protected readonly dbProvider: IDbProvider<TClient>) {}

  protected get db(): TClient {
    return this.dbProvider.current();
  }
}
