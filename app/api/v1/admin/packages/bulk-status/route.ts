import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  action: z.enum(["approve", "archive"]),
  packageIds: z.array(z.string().min(1)).min(1).max(50),
});

const actionStatusMap: Record<"approve" | "archive", "APPROVED" | "ARCHIVED"> = {
  approve: "APPROVED",
  archive: "ARCHIVED",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
    }

    const { action, packageIds } = parsed.data;
    const nextStatus = actionStatusMap[action];

    await prisma.$transaction(async (tx) => {
      await tx.healthPackage.updateMany({
        where: { id: { in: packageIds } },
        data: { status: nextStatus, updatedAt: new Date() },
      });
      await tx.approvalLog.createMany({
        data: packageIds.map((id) => ({
          packageId: id,
          action,
          actorId: user.id!,
          reason: action === "approve" ? null : "Bulk archive",
        })),
      });
      await tx.auditTrail.createMany({
        data: packageIds.map((id) => ({
          actorId: user.id!,
          action: action === "approve" ? "APPROVE_PACKAGE" : "ARCHIVE_PACKAGE",
          entityId: id,
          entityType: "healthPackage",
          diff: { status: nextStatus },
        })),
      });
    });

    try {
      revalidatePath("/packages");
      revalidatePath("/admin/packages");
      revalidateTag("packages:list");
    } catch (err) {
      logger.warn("admin.bulk-status.revalidate_failed", { error: `${err}` });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("admin.bulk-status.failed", { error: `${error}` });
    return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะแบบกลุ่มได้" }, { status: 500 });
  }
}
