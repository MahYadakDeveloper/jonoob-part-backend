import { sql } from 'drizzle-orm';
import { bigint, check, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { mediaSchema } from './media.schema';

export const mimeTypes = {
  image: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/gif',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/heif',
    'image/heic',
    'image/jxl',
    'image/x-icon',
  ] as const,
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/mpeg',
    'video/mp2t',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-ms-wmv',
    'video/x-flv',
    'video/3gpp',
    'video/3gpp2',
  ] as const,
  document: ['text/markdown', 'text/mdx'] as const,
} as const;

export const mediaType = mediaSchema.enum(
  'media_type',
  Object.keys(mimeTypes) as [
    keyof typeof mimeTypes,
    ...(keyof typeof mimeTypes)[],
  ],
);

export const mediaMimeType = mediaSchema.enum(
  'mime_type',
  Object.values(mimeTypes).flat() as [
    (typeof mimeTypes)[keyof typeof mimeTypes][number],
    ...(typeof mimeTypes)[keyof typeof mimeTypes][number][],
  ],
);

export const mediaFiles = mediaSchema.table(
  'media_files',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    type: mediaType('type').notNull(),
    mime: mediaMimeType('mime').notNull(),

    fileName: text('file_name').notNull(),
    size: bigint('size', { mode: 'number' }),
    alt: text('alt'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      'media_files_file_name_not_blank',
      sql`char_length(btrim(${t.fileName})) > 0`,
    ),
    check(
      'media_files_file_name_length',
      sql`char_length(${t.fileName}) <= 255`,
    ),
    check('media_files_file_name_no_path', sql`${t.fileName} !~ '[/\\\\]'`),

    check('media_files_size_positive', sql`${t.size} is null or ${t.size} > 0`),

    check(
      'media_files_alt_valid',
      sql`${t.alt} is null or (char_length(btrim(${t.alt})) > 0 and char_length(${t.alt}) <= 500)`,
    ),

    check(
      'media_files_type_matches_mime',
      sql`(${t.type} = 'image' and ${t.mime}::text like 'image/%')
     or (${t.type} = 'video' and ${t.mime}::text like 'video/%')
     or (${t.type} = 'document' and ${t.mime}::text in ('text/markdown', 'text/mdx'))`,
    ),

    check(
      'media_files_document_extension_matches_mime',
      sql`${t.type} <> 'document'
     or (${t.mime}::text = 'text/markdown' and ${t.fileName} ~* '[.]md$')
     or (${t.mime}::text = 'text/mdx' and ${t.fileName} ~* '[.]mdx$')`,
    ),

    check(
      'media_files_document_size_limit',
      sql`${t.type} <> 'document' or ${t.size} is null or ${t.size} <= 1048576`,
    ),
  ],
);
