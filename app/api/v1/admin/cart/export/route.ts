import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSession();
    const user = session?.user as { id?: string; role?: string } | undefined;
    if (!user?.id || (user.role !== "ADMIN" && user.role !== "EDITOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const carts = await prisma.cart.findMany({
      include: {
        user: { select: { email: true, name: true } },
        items: {
          include: {
            package: {
              select: {
                title: true,
                slug: true,
                hospital: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    const headers = [
      "user_email",
      "user_name",
      "package_title",
      "package_slug",
      "hospital_name",
      "quantity",
      "added_at",
    ];

    const rows: string[] = [headers.join(",")];

    for (const cart of carts) {
      for (const item of cart.items) {
        rows.push(
          [
            cart.user?.email ?? "",
            cart.user?.name ?? "",
            item.package?.title ?? "",
            item.package?.slug ?? "",
            item.package?.hospital?.name ?? "",
            item.quantity.toString(),
            item.addedAt.toISOString(),
          ]
            .map((value) => `"${value.replace(/"/g, '""')}"`)
            .join(",")
        );
      }
    }

    const csv = rows.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=cart-interest-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  } catch (error) {
    logger.error("admin.cart.export_failed", { error: `${error}` });
    return NextResponse.json({ error: "ไม่สามารถส่งออกข้อมูลได้" }, { status: 500 });
  }
}
