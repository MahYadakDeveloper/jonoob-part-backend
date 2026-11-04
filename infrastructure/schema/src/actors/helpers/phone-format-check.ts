import { sql } from 'drizzle-orm';
import { check, type AnyPgColumn } from 'drizzle-orm/pg-core';

const IR_MOBILE_REGEX = '^09[0-9]{9}$';

export const PHONE_FORMAT_CHECK = 'phone_format_chk';

export const phoneFormatCheck = (column: AnyPgColumn) =>
  check(
    PHONE_FORMAT_CHECK,
    sql`${column} ~ ${sql.raw(`'${IR_MOBILE_REGEX}'`)}`,
  );
