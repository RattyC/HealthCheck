import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/tokens";
import { rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const schema = z.object({ ids: z.array(z.string().cuid()).min(2).max(4) });

export async function POST(request: Request) {
  const limiter = rateLimit(`compare-share:${request.headers.get("x-forwarded-for") ?? "unknown"}`, 60);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องเลือกอย่างน้อย 2 แพ็กเกจ" }, { status: 422 });
  }
  const { ids } = parsed.data;
  const slug = generateToken(6);
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  try {
    await prisma.compareSnapshot.create({
      data: {
        slug,
        packageIds: ids,
        userId,
      },
    });
  } catch (error) {
    logger.error("api.compare.share_failed", { error: `${error}` });
    return NextResponse.json({ error: "ไม่สามารถสร้างลิงก์ได้" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, slug });
}
