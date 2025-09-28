import { NextResponse } from "next/server";
import { performance } from "node:perf_hooks";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  const started = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    const duration = Number((performance.now() - started).toFixed(2));
    return NextResponse.json({ ok: true, db: "up", durationMs: duration });
  } catch (error) {
    logger.error("healthz.db_down", { error: `${error}` });
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
