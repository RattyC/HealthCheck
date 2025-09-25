import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth";
import { adminStatusUpdateSchema } from "@/lib/validators";

const paramSchema = z.object({ id: z.string().min(1) });

const statusMap: Record<string, "APPROVED" | "DRAFT" | "ARCHIVED"> = {
  approve: "APPROVED",
  reject: "DRAFT",
  archive: "ARCHIVED",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authConfig);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
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
        data: { packageId: id, action, actorId: session.user.id, reason: reason ?? null },
      }),
      prisma.auditTrail.create({
        data: {
          actorId: session.user.id,
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
          userId: session.user.id,
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
      console.error("Failed to revalidate", err);
    }

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
