import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const paramSchema = z.object({ id: z.string().cuid() });

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resolved = paramSchema.safeParse(await params);
  if (!resolved.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });
  }
  const { id } = resolved.data;
  try {
    await prisma.savedSearch.delete({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("saved-search.delete_failed", { error: `${error}`, id });
    return NextResponse.json({ error: "ไม่สามารถลบการค้นหาได้" }, { status: 500 });
  }
}
