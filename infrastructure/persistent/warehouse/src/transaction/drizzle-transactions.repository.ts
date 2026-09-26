import {
  OffsetPagination,
  PageCriteria,
  PageResult,
  PageSort,
  type DbProvider,
} from '@feature/common';
import type {
  TransactionRepository,
  WarehouseTransaction,
} from '@feature/warehouse-transaction';
import { BaseRepository, type DbLockContext } from '@infra/persistent-common';
import { Inject, Injectable } from '@nestjs/common';
import { asc, desc, EmptyRelations, sql } from 'drizzle-orm';
import { NodePgDatabase, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { transactions } from './drizzle-transactions.schema';

@Injectable()
export class DrizzleTransactionsRepository
  extends BaseRepository<NodePgDatabase | NodePgTransaction<EmptyRelations>>
  implements TransactionRepository
{
  constructor(
    @Inject('DbProvider')
    dbProvider: DbProvider<NodePgDatabase>,
    @Inject('DbLockContext')
    private readonly lock: DbLockContext,
  ) {
    super(dbProvider);
  }

  async create(
    data: Omit<WarehouseTransaction, 'id' | 'recordedAt'>,
  ): Promise<void> {
    await this.db.insert(transactions).values({
      items: data.items,
      type: data.type,
      referenceId: data.reference.id,
      referenceSource: data.reference.source,
    });
  }

  async list(
    criteria: PageCriteria<OffsetPagination>,
  ): Promise<PageResult<WarehouseTransaction, OffsetPagination>> {
    const size = criteria.page.size;
    const page = criteria.page.page;

    const offset = (page - 1) * size;

    const orderBy = this.getOrderBy(criteria.sort);

    const [rows, countResult] = await Promise.all([
      this.db
        .select()
        .from(transactions)
        .orderBy(...orderBy)
        .limit(size)
        .offset(offset),

      this.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(transactions),
    ]);

    const totalItems = Number(countResult[0]?.count ?? 0);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / size);

    return {
      page: {
        items: rows.map((row) => this.toDomain(row)),
        number: page,
        size,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  private getOrderBy(sort?: PageSort) {
    const direction = sort?.direction ?? 'desc';

    if (direction === 'asc') {
      return [asc(transactions.recordedAt), asc(transactions.id)];
    }

    return [desc(transactions.recordedAt), desc(transactions.id)];
  }

  private toDomain(
    row: typeof transactions.$inferSelect,
  ): WarehouseTransaction {
    return {
      id: row.id,
      items: row.items,
      recordedAt: row.recordedAt,
      type: row.type,
      reference: {
        id: row.referenceId,
        source: row.referenceSource,
      },
    };
  }
}
