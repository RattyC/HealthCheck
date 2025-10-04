import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  packageId: z.string().cuid(),
  quantity: z.number().int().min(1).max(10).optional(),
  promotion: z
    .object({
      code: z.string().trim().min(1).max(40),
      label: z.string().trim().min(1).max(120),
    })
    .optional(),
  scheduledFor: z
    .string()
    .datetime()
    .optional(),
});

function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const userId = (session as { user?: { id?: unknown } }).user?.id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  const userId = extractUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`cart:get:${ip}`, Number(process.env.RATE_LIMIT_CART_GET ?? 120));
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          package: {
            select: {
              id: true,
              title: true,
              basePrice: true,
              hospital: { select: { name: true, id: true } },
              slug: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    cart,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = extractUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limiter = rateLimit(`cart:post:${ip}`, Number(process.env.RATE_LIMIT_CART_POST ?? 60));
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const { packageId, quantity = 1, promotion, scheduledFor } = parsed.data;
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: { updatedAt: new Date() },
      });

      const item = await tx.cartItem.upsert({
        where: { cartId_packageId: { cartId: cart.id, packageId } },
        update: {
          quantity: { increment: quantity },
          promotionCode: promotion?.code,
          promotionLabel: promotion?.label,
          scheduledFor: scheduledDate ?? undefined,
        },
        create: {
          cartId: cart.id,
          packageId,
          quantity,
          promotionCode: promotion?.code,
          promotionLabel: promotion?.label,
          scheduledFor: scheduledDate ?? undefined,
        },
        include: {
          package: {
            select: {
              id: true,
              title: true,
              basePrice: true,
              hospital: { select: { name: true, id: true } },
              slug: true,
            },
          },
        },
      });

      return { cart, item };
    });

    return NextResponse.json({ ok: true, item: result.item });
  } catch (error) {
    logger.error("cart.add_failed", { error: `${error}`, userId, packageId });
    return NextResponse.json({ error: "ไม่สามารถเพิ่มลงตะกร้าได้" }, { status: 500 });
  }
}
