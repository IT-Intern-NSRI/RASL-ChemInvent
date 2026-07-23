// Standard Next.js + Prisma singleton pattern: prevents creating a new
// PrismaClient on every hot-reload in development, which would otherwise
// exhaust the database's connection limit. Pure infrastructure - nothing
// to implement here.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
