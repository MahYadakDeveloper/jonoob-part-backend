import type { AnyPgColumn, PgSchema, PgTable } from 'drizzle-orm/pg-core';
import { mimeTypes } from '../media-files.schema';
import {
  createMediaLinkTable,
  type MediaLinkTableOptions,
} from './create-media-link-table';

type Owner = PgTable & { id: AnyPgColumn };

export type ImageMimeType = (typeof mimeTypes.image)[number];
export type VideoMimeType = (typeof mimeTypes.video)[number];
export type DocumentMimeType = (typeof mimeTypes.document)[number];

export const createImageTable = (
  schema: PgSchema,
  owner: Owner,
  options?: MediaLinkTableOptions<ImageMimeType>,
) =>
  createMediaLinkTable(
    schema,
    owner,
    { suffix: 'images', allMimes: mimeTypes.image, defaultRelation: 'toMany' },
    options,
  );

export const createVideoTable = (
  schema: PgSchema,
  owner: Owner,
  options?: MediaLinkTableOptions<VideoMimeType>,
) =>
  createMediaLinkTable(
    schema,
    owner,
    { suffix: 'videos', allMimes: mimeTypes.video, defaultRelation: 'toMany' },
    options,
  );

export const createDocumentTable = (
  schema: PgSchema,
  owner: Owner,
  options?: MediaLinkTableOptions<DocumentMimeType>,
) =>
  createMediaLinkTable(
    schema,
    owner,
    {
      suffix: 'documents',
      allMimes: mimeTypes.document,
      defaultRelation: 'toMany',
    },
    options,
  );
