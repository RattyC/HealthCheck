import { PrismaClient, type Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

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

const SLOW_QUERY_THRESHOLD = Number(process.env.PRISMA_SLOW_QUERY_MS ?? 500);

prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  if (duration >= SLOW_QUERY_THRESHOLD) {
    logger.warn("prisma.slow_query", {
      model: params.model,
      action: params.action,
      duration,
    });
  }
  return result;
});
