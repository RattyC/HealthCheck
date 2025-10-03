import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";
import { buildPaymentInstructions } from "@/lib/payments";
import { PaymentStatus } from "@prisma/client";

const checkoutSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6).max(40).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["promptpay", "bank_transfer", "credit_card", "cash"]).default("promptpay"),
});

function extractUserId(session: unknown): string | null {
  if (!session || typeof session !== "object") return null;
  const userId = (session as { user?: { id?: unknown } }).user?.id;
  return typeof userId === "string" && userId.length > 0 ? userId : null;
}

function generateReferenceCode() {
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `HC${datePart}-${randomPart}`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  const userId = extractUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 422 });
  }

  const { fullName, email, phone, notes, paymentMethod } = parsed.data;

  try {
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
                hospital: { select: { name: true } },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });

    const cartItems = cart?.items ?? [];
    const validItems = cartItems.filter(
      (item): item is typeof item & { package: NonNullable<typeof item.package> } => Boolean(item.package)
    );
    if (!cart || validItems.length === 0) {
      return NextResponse.json({ error: "ตะกร้าว่างหรือแพ็กเกจไม่พร้อมจำหน่าย" }, { status: 400 });
    }

    const hasMissingSchedule = validItems.some((item) => !item.scheduledFor);
    if (hasMissingSchedule) {
      return NextResponse.json(
        { error: "กรุณาจองวันและเวลาสำหรับทุกแพ็กเกจก่อนยืนยันคำสั่งซื้อ" },
        { status: 400 }
      );
    }

    const total = validItems.reduce((sum, item) => sum + item.quantity * (item.package?.basePrice ?? 0), 0);
    if (total <= 0) {
      return NextResponse.json({ error: "ไม่สามารถคำนวณยอดรวมได้" }, { status: 400 });
    }

    const referenceCode = generateReferenceCode();
    const paymentStatus: PaymentStatus = paymentMethod === "cash" || paymentMethod === "bank_transfer" ? "AWAITING_CONFIRMATION" : "PENDING";

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          referenceCode,
          fullName,
          email,
          phone,
          notes,
          totalAmount: total,
          paymentMethod,
          paymentStatus,
          items: {
            create: validItems.map((item) => ({
              packageId: item.package.id,
              packageTitle: item.package.title,
              hospitalName: item.package.hospital?.name ?? null,
              unitPrice: item.package.basePrice,
              quantity: item.quantity,
              subtotal: item.quantity * item.package.basePrice,
              promotionCode: item.promotionCode ?? null,
              promotionLabel: item.promotionLabel ?? null,
              scheduledFor: item.scheduledFor ?? undefined,
            })),
          },
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

      return created;
    });

    const payment = buildPaymentInstructions(paymentMethod, order.paymentStatus, order.totalAmount, order.referenceCode);

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        referenceCode: order.referenceCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
      payment,
    });
  } catch (error) {
    logger.error("checkout.create_failed", { error: `${error}`, userId });
    return NextResponse.json(
      {
        error: "ระบบไม่สามารถบันทึกคำสั่งซื้อได้ในขณะนี้ กรุณาลองใหม่ภายหลังหรือแจ้งทีมงาน",
      },
      { status: 503 }
    );
  }
}
