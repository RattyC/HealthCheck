// Admin report summarising user cart activity for follow-up and analytics.
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export const revalidate = 0;

const MAX_CART_ITEMS = 250;

function formatDate(date: Date) {
  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

export default async function AdminCartPage() {
  await requireRole(["ADMIN", "EDITOR"], "/dashboard");

  let carts:
    | Array<{
        id: string;
        updatedAt: Date;
        user: { id: string; name: string | null; email: string };
        items: Array<{
          id: string;
          quantity: number;
          addedAt: Date;
          package: {
            id: string;
            title: string;
            slug: string;
            basePrice: number;
            hospital: { name: string | null } | null;
          };
        }>;
      }>
    | undefined;
  let loadError: string | null = null;

  try {
    carts = await prisma.cart.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            package: {
              select: {
                id: true,
                title: true,
                basePrice: true,
                hospital: { select: { name: true } },
                slug: true,
              },
            },
          },
          orderBy: { addedAt: "desc" },
          take: MAX_CART_ITEMS,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      loadError = "ยังไม่ได้สร้างตาราง Cart/CartItem กรุณารัน prisma migrate deploy ก่อนใช้งานรายงานนี้";
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      loadError = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ โปรดตรวจสอบ DATABASE_URL";
    } else {
      loadError = "โหลดข้อมูลตะกร้าผู้ใช้ไม่ได้ กรุณาลองใหม่อีกครั้ง";
    }
  }

  const entries = (carts ?? [])
    .flatMap((cart) =>
      cart.items.map((item) => ({
        cartId: cart.id,
        userId: cart.user.id,
        userName: cart.user.name ?? cart.user.email ?? "ไม่ระบุชื่อ",
        userEmail: cart.user.email ?? "",
        packageId: item.package.id,
        packageTitle: item.package.title,
        packageSlug: item.package.slug,
        hospitalName: item.package.hospital?.name ?? "ไม่ระบุโรงพยาบาล",
        quantity: item.quantity,
        amount: item.quantity * item.package.basePrice,
        addedAt: item.addedAt,
      }))
    )
    .sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime())
    .slice(0, MAX_CART_ITEMS);

  const totalItems = entries.length;
  const totalValue = entries.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ตะกร้าของผู้ใช้งาน</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">ดูว่าใครกำลังสนใจแพ็กเกจใดเพื่อช่วยติดตามและเสนอขาย</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-wide text-slate-500">จำนวนผู้ใช้ที่มีตะกร้า</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{carts?.length ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-wide text-slate-500">จำนวนรายการในตะกร้า</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{totalItems}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-wide text-slate-500">มูลค่ารวมโดยประมาณ</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(totalValue)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="text-xs uppercase tracking-wide text-slate-500">อัปเดตล่าสุด</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {entries[0]?.addedAt ? formatDate(entries[0].addedAt) : "-"}
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/70 p-10 text-center text-rose-600 shadow-sm dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-base font-medium">{loadError}</p>
          <p className="mt-2 text-sm">
            ตั้งค่า `DATABASE_URL` ให้ถูกต้อง และรัน <code>npx prisma migrate deploy</code> เพื่อสร้างตาราง Cart
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          ยังไม่มีผู้ใช้งานเพิ่มแพ็กเกจลงตะกร้า
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">แสดงสูงสุด {MAX_CART_ITEMS} รายการล่าสุด</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">ผู้ใช้งาน</th>
                  <th className="px-4 py-3 text-left">แพ็กเกจ</th>
                  <th className="px-4 py-3 text-left">โรงพยาบาล</th>
                  <th className="px-4 py-3 text-right">จำนวน</th>
                  <th className="px-4 py-3 text-right">มูลค่า</th>
                  <th className="px-4 py-3 text-right">เพิ่มเมื่อ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {entries.map((entry) => (
                  <tr key={`${entry.userId}-${entry.packageId}-${entry.addedAt.getTime()}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{entry.userName}</div>
                      <div className="text-xs text-slate-500">{entry.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/packages/${entry.packageSlug ?? entry.packageId}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {entry.packageTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.hospitalName}</td>
                    <td className="px-4 py-3 text-right">{entry.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-white">{formatCurrency(entry.amount)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">{formatDate(entry.addedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
