import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const hospitals = await prisma.hospital.findMany({
      include: { _count: { select: { packages: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(hospitals);
  } catch (error) {
    logger.error("api.hospitals.failed", { error: `${error}` });
    return NextResponse.json([]);
  }
}
