import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const bodySchema = z.object({ packageId: z.string().cuid() });

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limiter = rateLimit(`bookmark:${userId}`, 120);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }
  try {
    const bookmark = await prisma.bookmark.upsert({
      where: { userId_packageId: { userId, packageId: parsed.data.packageId } },
      update: {},
      create: { userId, packageId: parsed.data.packageId },
    });
    return NextResponse.json({ ok: true, item: bookmark });
  } catch (error) {
    logger.error("bookmark.create_failed", { error: `${error}` });
    return NextResponse.json({ error: "ไม่สามารถบันทึกแพ็กเกจได้" }, { status: 500 });
  }
}
