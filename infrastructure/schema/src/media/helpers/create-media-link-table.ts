import { getTableName, sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
  type PgSchema,
  type PgTable,
} from 'drizzle-orm/pg-core';
import { mediaFiles, mediaMimeType, mimeTypes } from '../media-files.schema';

export type MimeType = (typeof mimeTypes)[keyof typeof mimeTypes][number];

export type MediaLinkTableOptions<M extends MimeType> = {
  /** Table name. Defaults to `${ownerTable}_${suffix}`. */
  name?: string;
  /** Subset of the allowed MIME types. */
  mimes?: readonly M[];
  /** Behavior when the owner is deleted. */
  onOwnerDelete?: 'cascade' | 'restrict';
  /** toOne = one file per owner; toMany = many files per owner. */
  relation?: 'toOne' | 'toMany';
};

export const createMediaLinkTable = <M extends MimeType>(
  schema: PgSchema,
  owner: PgTable & { id: AnyPgColumn },
  config: {
    suffix: string;
    allMimes: readonly M[];
    defaultRelation: 'toOne' | 'toMany';
  },
  options: MediaLinkTableOptions<M> = {},
) => {
  const {
    name = `${getTableName(owner)}_${config.suffix}`,
    mimes = config.allMimes,
    onOwnerDelete = 'cascade',
    relation = config.defaultRelation,
  } = options;

  if (!/^[a-z][a-z0-9_]{0,40}$/.test(name)) {
    throw new Error(`invalid table name: ${name}`);
  }
  if (mimes.length === 0) {
    throw new Error(`${name}: mime list must not be empty`);
  }

  const mimeList = sql.raw(mimes.map((m) => `'${m}'`).join(', '));

  return schema.table(
    name,
    {
      id: uuid('id').defaultRandom().primaryKey(),
      ownerId: uuid('owner_id').notNull(),

      fileId: uuid('file_id').notNull(),
      mime: mediaMimeType('mime').notNull(),

      sortOrder: integer('sort_order').notNull().default(0),

      createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    },
    (t) => [
      check(`${name}_mime_allowed_chk`, sql`${t.mime}::text in (${mimeList})`),
      check(`${name}_sort_order_chk`, sql`${t.sortOrder} >= 0`),

      foreignKey({
        name: `${name}_owner_fk`,
        columns: [t.ownerId],
        foreignColumns: [owner.id],
      }).onDelete(onOwnerDelete),

      foreignKey({
        name: `${name}_file_fk`,
        columns: [t.fileId, t.mime],
        foreignColumns: [mediaFiles.id, mediaFiles.mime],
      }).onDelete('restrict'),

      unique(`${name}_file_id_unique`).on(t.fileId),

      relation === 'toOne'
        ? unique(`${name}_owner_id_unique`).on(t.ownerId)
        : index(`${name}_owner_sort_idx`).on(t.ownerId, t.sortOrder),
    ],
  );
};
