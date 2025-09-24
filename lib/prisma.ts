import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const logs =
  process.env.PRISMA_LOG === "verbose"
    ? (["query", "info", "warn", "error"] as const)
    : process.env.NODE_ENV === "development"
    ? ([] as const)
    : (["error"] as const);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logs as any,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
