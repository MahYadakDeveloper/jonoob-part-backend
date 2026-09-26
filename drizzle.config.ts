import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './generated/drizzle',
  schema: './infrastructure/persistent/**/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PG_DATABASE_URL!,
  },
});
