import { PostgresClient } from '@prisma/orm-postgres/runtime';
import { Contract } from './../generated/prisma/contract';

export type PrismaDbClient = PostgresClient<Contract>;

export type PrismaTransaction = Parameters<Parameters<PrismaDbClient['transaction']>[0]>[0];

export type PrismaDbContext = PrismaDbClient | PrismaTransaction;
