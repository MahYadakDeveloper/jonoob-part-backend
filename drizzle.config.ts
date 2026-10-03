import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './generated/drizzle',
  schema: [
    './feature/**/src/**/*.drizzle.schema.ts',
    './infrastructure/**/src/**/*.drizzle.schema.ts',
  ],
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
