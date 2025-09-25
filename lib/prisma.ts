import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const logLevels: Prisma.LogLevel[] =
  process.env.PRISMA_LOG === "verbose"
    ? ["query", "info", "warn", "error"]
    : process.env.NODE_ENV === "development"
    ? []
    : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
