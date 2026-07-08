export interface Datasource<TEntity, TId> {
  find(id: TId): Promise<TEntity | undefined>;
  findMany(ids: readonly TId[]): Promise<TEntity[]>;
  findManyForUpdate(ids: readonly TId[]): Promise<TEntity[]>;

  create(entity: TEntity): Promise<void>;

  update(entity: TEntity): Promise<void>;

  updateMany(entities: readonly TEntity[]): Promise<void>;

  delete(id: TId): Promise<void>;
  deleteMany(ids: TId[]): Promise<void>;

  transaction<TResult>(
    callback: (datasource: this) => Promise<TResult>,
  ): Promise<TResult>;
}
