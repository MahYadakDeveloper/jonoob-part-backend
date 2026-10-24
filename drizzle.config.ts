import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './generated/drizzle',
  schema: './feature/shared/src/schema/**/*.schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
