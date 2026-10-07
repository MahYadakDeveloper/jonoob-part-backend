import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './generated/drizzle',
  schema: './infrastructure/database/drizzle/src/schema/**/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
