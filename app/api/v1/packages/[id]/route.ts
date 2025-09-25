import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const paramSchema = z.object({ id: z.string().min(1) });
const VIEW_LIMIT = Number(process.env.RATE_LIMIT_PACKAGE ?? 240);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limiter = rateLimit(`package:${req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown"}`, VIEW_LIMIT);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const resolved = await params;
    const { id } = paramSchema.parse(resolved);
    const pkg = await prisma.healthPackage.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        hospital: true,
        includes: true,
        histories: { orderBy: { recordedAt: "asc" } },
        metrics: true,
      },
    });

    if (!pkg) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const session = await getServerSession(authConfig);
    await prisma.$transaction([
      prisma.packageMetric.upsert({
        where: { packageId: pkg.id },
        update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
        create: { packageId: pkg.id, viewCount: 1 },
      }),
      prisma.packageView.create({
        data: {
          packageId: pkg.id,
          userId: session?.user?.id,
          type: "VIEW",
          source: "package-detail",
        },
      }),
    ]);

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
