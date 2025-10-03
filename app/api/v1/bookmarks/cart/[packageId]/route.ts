import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const userId = (session as { user?: { id?: unknown } }).user?.id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ packageId: string }> }) {
  const params = await context.params;
  const packageId = params.packageId;
  const session = await getSession();
  const userId = extractUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({ where: { userId }, select: { id: true } });
      if (!cart) {
        return;
      }

      await tx.cartItem
        .delete({ where: { cartId_packageId: { cartId: cart.id, packageId } } })
        .catch((error) => {
          if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2025") {
            return null;
          }
          throw error;
        });

      await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("cart.remove_failed", { error: `${error}`, userId, packageId });
    return NextResponse.json({ error: "ไม่สามารถลบออกจากตะกร้าได้" }, { status: 500 });
  }
}
