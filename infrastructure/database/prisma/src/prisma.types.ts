import { Prisma, PrismaClient } from "./generated/prisma/client";

export type PrismaDbClient = PrismaClient | Prisma.TransactionClient;
