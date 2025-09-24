import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  try {
    const id = params.id;
    const { action, reason, actorId } = await req.json();
    const map: Record<string, "APPROVED" | "DRAFT" | "ARCHIVED"> = {
      approve: "APPROVED",
      reject: "DRAFT",
      archive: "ARCHIVED",
    };
    const newStatus = map[action];
    if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    const updated = await prisma.healthPackage.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.approvalLog.create({
      data: { packageId: id, action, actorId: actorId ?? null, reason: reason ?? null },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

