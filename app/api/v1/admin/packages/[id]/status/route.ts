import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { adminStatusUpdateSchema } from "@/lib/validators";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const paramSchema = z.object({ id: z.string().min(1) });

const statusMap: Record<string, "APPROVED" | "DRAFT" | "ARCHIVED"> = {
  approve: "APPROVED",
  reject: "DRAFT",
  archive: "ARCHIVED",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`admin-status:${ip}`, 60);
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "ADMIN" && role !== "EDITOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = paramSchema.safeParse(await params);
  if (!resolvedParams.success) {
    return NextResponse.json({ error: "Invalid package id" }, { status: 400 });
  }

  const payload = adminStatusUpdateSchema.safeParse(await req.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Invalid payload", issues: payload.error.flatten() }, { status: 422 });
  }
  const { id } = resolvedParams.data;
  const { action, reason } = payload.data;
  const newStatus = statusMap[action];

  try {
    const [updated] = await prisma.$transaction([
      prisma.healthPackage.update({
        where: { id },
        data: { status: newStatus, updatedAt: new Date() },
      }),
      prisma.approvalLog.create({
        data: { packageId: id, action, actorId: userId, reason: reason ?? null },
      }),
      prisma.auditTrail.create({
        data: {
          actorId: userId,
          action: action === "approve" ? "APPROVE_PACKAGE" : action === "reject" ? "REJECT_PACKAGE" : "ARCHIVE_PACKAGE",
          entityId: id,
          entityType: "healthPackage",
          diff: { status: newStatus, reason },
        },
      }),
    ]);

    await prisma.notification.createMany({
      data: [
        {
          userId,
          type: "GENERAL",
          payload: { action, packageId: id },
        },
      ],
    });

    try {
      revalidatePath("/packages");
      revalidatePath("/admin/packages");
      revalidateTag(`package:${id}`);
    } catch (err) {
      logger.warn("revalidate.failed", { error: `${err}` });
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    logger.error("admin.package.status_failed", { error: `${error}` });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
