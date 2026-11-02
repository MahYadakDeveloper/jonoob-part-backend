import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
// Adjust to your project path.
import { DrizzleBaseRepository } from '@infra/schema/drizzle-base.repository';

export interface StockFkRef {
  /** Schema-qualified, quoted by Postgres. */
  table: string;
  column: string;
  /** Column of stocks the FK points to (id or seq). */
  refColumn: string;
}

export interface PurgeBatchOptions {
  batchSize: number;
  graceDays: number;
  statementTimeoutMs: number;
}

@Injectable()
export class EmptyStocksPurgeRepository extends DrizzleBaseRepository {
  /** Every FK that points to warehouse.stocks, read from the catalog. */
  async findReferences(): Promise<StockFkRef[]> {
    const res = await this.db.execute<{
      table: string;
      column: string;
      ref_column: string;
      ncols: number;
    }>(sql`
      SELECT format('%I.%I', n.nspname, cl.relname) AS "table",
             quote_ident(a.attname)                 AS "column",
             quote_ident(ra.attname)                AS ref_column,
             cardinality(c.conkey)                  AS ncols
        FROM pg_constraint c
        JOIN pg_class cl     ON cl.oid = c.conrelid
        JOIN pg_namespace n  ON n.oid = cl.relnamespace
        JOIN pg_attribute a  ON a.attrelid = c.conrelid   AND a.attnum = c.conkey[1]
        JOIN pg_attribute ra ON ra.attrelid = c.confrelid AND ra.attnum = c.confkey[1]
       WHERE c.contype = 'f'
         AND c.confrelid = 'warehouse.stocks'::regclass
    `);

    return res.rows.map((r) => {
      if (r.ncols !== 1) {
        throw new Error(`Composite FK to warehouse.stocks on ${r.table} is not supported`);
      }
      return { table: r.table, column: r.column, refColumn: r.ref_column };
    });
  }

  /**
   * Deletes one batch of stocks that are empty past the grace period and
   * unreferenced. Locked rows are skipped, never waited on.
   * Returns the deleted labels (stocks.id).
   */
  async deleteEmptyBatch(refs: StockFkRef[], opts: PurgeBatchOptions): Promise<string[]> {
    // Identifiers come from the catalog (quoted), never from user input.
    const notExists = refs.map(
      (r) => sql`AND NOT EXISTS (
        SELECT 1 FROM ${sql.raw(r.table)} x
         WHERE x.${sql.raw(r.column)} = s.${sql.raw(r.refColumn)}
      )`,
    );

    return this.transaction(async () => {
      await this.db.execute(
        sql`SELECT set_config('statement_timeout', ${String(opts.statementTimeoutMs)}, true)`,
      );

      const res = await this.db.execute<{ id: string }>(sql`
        WITH picked AS (
          SELECT s.seq
            FROM warehouse.stocks s
           WHERE s.quantity = 0
             AND s.zeroed_at <= now() - make_interval(days => ${opts.graceDays}::int)
             ${sql.join(notExists, sql` `)}
           ORDER BY s.zeroed_at, s.seq
           LIMIT ${opts.batchSize}
             FOR UPDATE OF s SKIP LOCKED
        )
        DELETE FROM warehouse.stocks s
         USING picked p
         WHERE s.seq = p.seq
           AND s.quantity = 0
        RETURNING s.id
      `);
      return res.rows.map((r) => r.id);
    });
  }
}
