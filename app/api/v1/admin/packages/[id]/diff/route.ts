import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = paramsSchema.safeParse(await params);
  if (!resolvedParams.success) {
    return NextResponse.json({ error: "Invalid package id" }, { status: 400 });
  }

  try {
    const pkg = await prisma.healthPackage.findUnique({
      where: { id: resolvedParams.data.id },
      include: {
        hospital: { select: { id: true, name: true } },
        includes: { select: { id: true, name: true, groupName: true, isOptional: true } },
        histories: { orderBy: { recordedAt: "asc" } },
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const sortedHistory = pkg.histories ?? [];
    const currentPrice = pkg.basePrice;
    const previousEntry = sortedHistory
      .filter((entry) => entry.recordedAt < pkg.updatedAt)
      .slice(-1)[0] ?? sortedHistory.slice(0, -1).slice(-1)[0] ?? null;

    const response = {
      ok: true,
      package: {
        id: pkg.id,
        title: pkg.title,
        slug: pkg.slug,
        description: pkg.description,
        basePrice: pkg.basePrice,
        priceNote: pkg.priceNote,
        status: pkg.status,
        updatedAt: pkg.updatedAt.toISOString(),
        hospital: {
          id: pkg.hospital?.id ?? null,
          name: pkg.hospital?.name ?? null,
        },
        includes: pkg.includes.map((item) => ({
          id: item.id,
          name: item.name,
          groupName: item.groupName,
          isOptional: item.isOptional,
        })),
        priceHistory: sortedHistory.map((entry) => ({
          id: entry.id,
          price: entry.price,
          recordedAt: entry.recordedAt.toISOString(),
          notes: entry.notes ?? null,
        })),
        diff: {
          currentPrice,
          previousPrice: previousEntry?.price ?? null,
          previousRecordedAt: previousEntry ? previousEntry.recordedAt.toISOString() : null,
          priceChange: previousEntry ? currentPrice - previousEntry.price : null,
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("admin.package.diff_failed", { error: `${error}` });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
