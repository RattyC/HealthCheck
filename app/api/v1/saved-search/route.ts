import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { savedSearchSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const querySchema = z.object({ limit: z.coerce.number().min(1).max(50).default(10) });

export async function GET(req: NextRequest) {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ limit: searchParams.get("limit") ?? 10 });
  const limit = parsed.success ? parsed.data.limit : 10;
  const searches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json(searches);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limiter = rateLimit(`saved-search:${userId}`, 40);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const payload = savedSearchSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", issues: payload.error.flatten() }, { status: 422 });
  }
  try {
    const created = await prisma.savedSearch.create({
      data: {
        userId,
        name: payload.data.name,
        params: payload.data.params,
      },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (error) {
    logger.error("saved-search.create_failed", { error: `${error}` });
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}
