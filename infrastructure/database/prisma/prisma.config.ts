import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: 'prisma/contract.prisma',
    output: 'generated/prisma',
    db: {
      connection: process.env.DATABASE_URL!,
    },
  }),
});
