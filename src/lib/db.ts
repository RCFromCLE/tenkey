// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}