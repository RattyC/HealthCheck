// Authenticated cart summary where users review, remove, and proceed with selected packages.
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import RemoveCartItemButton from "@/components/RemoveCartItemButton";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

export default async function CartPage() {
  const user = await requireUser("/cart");

  const cart = await prisma.cart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          package: {
            select: {
              id: true,
              title: true,
              slug: true,
              basePrice: true,
              hospital: { select: { name: true } },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
    },
  });

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.quantity * item.package.basePrice, 0);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ตะกร้าแพ็กเกจสุขภาพ</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">จัดการแพ็กเกจที่คุณต้องการสอบถามหรือจองกับโรงพยาบาล</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="text-base font-medium">ยังไม่มีแพ็กเกจในตะกร้า</p>
          <p className="mt-2 text-sm">เพิ่มแพ็กเกจที่สนใจจากหน้ารายละเอียดเพื่อเตรียมส่งคำขอได้เลย</p>
          <div className="mt-6">
            <Link
              href="/packages"
              className="inline-flex items-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              ค้นหาแพ็กเกจ
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/packages/${item.package.slug ?? item.package.id}`}
                      className="text-base font-semibold text-slate-900 hover:text-brand dark:text-white dark:hover:text-brand/80"
                    >
                      {item.package.title}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.package.hospital?.name ?? "ไม่ระบุโรงพยาบาล"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                      <div>จำนวน: {item.quantity}</div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.package.basePrice * item.quantity)}
                      </div>
                    </div>
                    <RemoveCartItemButton packageId={item.package.id} />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">สรุปตะกร้า</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <dt>จำนวนแพ็กเกจ</dt>
                <dd>{items.length} รายการ</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>รวมทั้งหมด</dt>
                <dd className="text-base font-semibold text-slate-900 dark:text-white">{formatCurrency(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              ทีมงานจะติดต่อคุณเพื่อยืนยันรายละเอียดแพ็กเกจและโปรโมชั่นจากโรงพยาบาลที่เกี่ยวข้อง
            </p>
            <Link
              href="/support/contact"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              ส่งคำขอใบเสนอราคา
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
