import Link from "next/link";
import { Info, ShoppingCart } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import CheckoutForm from "@/components/CheckoutForm";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  type CartWithItems = Prisma.CartGetPayload<{
    include: {
      items: {
        include: {
          package: {
            select: { id: true; title: true; slug: true; basePrice: true; hospital: { select: { name: true } } };
          };
        };
      };
    };
  }>;

  let cart: CartWithItems | null = null;
  let loadError: string | null = null;

  try {
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
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
  } catch (error) {
    loadError = "ไม่สามารถโหลดข้อมูลตะกร้าได้ในขณะนี้";
    logger.error("checkout.page.cart_failed", { error: `${error}`, userId: user.id });
  }

  const items = cart?.items ?? [];
  const validItems = items.filter(
    (item): item is typeof item & { package: NonNullable<typeof item.package> } => Boolean(item.package)
  );
  const total = validItems.reduce<number>((sum, item) => sum + item.quantity * item.package.basePrice, 0);
  const missingSchedule = validItems.some((item) => !item.scheduledFor);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ยืนยันคำสั่งซื้อและเลือกชำระเงิน</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ตรวจสอบรายละเอียดแพ็กเกจสุขภาพและแจ้งข้อมูลติดต่อ ทีมงานจะยืนยันสิทธิ์และส่งขั้นตอนชำระเงินให้คุณ
        </p>
      </header>

      {loadError ? (
        <div className="flex items-start gap-2 rounded-2xl border border-dashed border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            {loadError} กรุณาลองรีเฟรชหน้าหรือกลับไปที่หน้าตะกร้าอีกครั้ง ถ้ายังเกิดปัญหาให้ติดต่อเจ้าหน้าที่
          </p>
        </div>
      ) : null}

      {missingSchedule ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-100">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            กรุณาจองวันและเวลาสำหรับทุกแพ็กเกจให้ครบก่อนยืนยันคำสั่งซื้อ เจ้าหน้าที่ต้องใช้ข้อมูลเพื่อสำรองคิวโรงพยาบาล
          </p>
        </div>
      ) : null}

      {validItems.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <ShoppingCart className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ยังไม่มีแพ็กเกจในตะกร้า</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">เลือกแพ็กเกจสุขภาพที่สนใจจากหน้ารายละเอียดเพื่อเพิ่มลงตะกร้าก่อนดำเนินการชำระเงิน</p>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/packages"
              className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              ค้นหาแพ็กเกจทั้งหมด
            </Link>
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              กลับไปตะกร้า
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">รายการในตะกร้า</h2>
              <ul className="mt-4 space-y-4">
                {validItems.map((item) => (
                  <li key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{item.package.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{item.package.hospital?.name ?? "ไม่ระบุโรงพยาบาล"}</div>
                        {item.promotionLabel ? (
                          <div className="text-xs text-brand">โปรโมชั่น: {item.promotionLabel}</div>
                        ) : (
                          <div className="text-xs text-amber-600 dark:text-amber-300">
                            ยังไม่ได้เลือกโปรโมชั่น • <Link href={`/packages/${item.package.slug ?? item.package.id}`} className="underline">เลือกโปรโมชั่น</Link>
                          </div>
                        )}
                        {item.scheduledFor ? (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            วันรับบริการ: {new Date(item.scheduledFor).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                          </div>
                        ) : (
                          <div className="text-xs text-rose-500 dark:text-rose-300">
                            กรุณาจองวันรับบริการ • <Link href={`/packages/${item.package.slug ?? item.package.id}`} className="underline">ไปจอง</Link>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                        <div>จำนวน {item.quantity} ราย</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {currency.format(item.quantity * item.package.basePrice)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ({currency.format(item.package.basePrice)} ต่อแพ็ก)
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ข้อมูลการติดต่อ</h2>
              <CheckoutForm defaultFullName={user.name ?? ""} defaultEmail={user.email ?? ""} />
            </section>
          </div>

          <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">สรุปยอดชำระ</h2>
            <dl className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <dt>แพ็กเกจทั้งหมด</dt>
                <dd>{validItems.length} รายการ</dd>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-slate-900 dark:text-white">
                <dt>ยอดชำระรวม</dt>
                <dd>{currency.format(total)}</dd>
              </div>
            </dl>
            <div className="rounded-xl bg-slate-100/80 p-3 text-xs text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
              หลังจากยืนยัน ทีมงานจะติดต่อกลับภายใน 1 ชั่วโมงเพื่อยืนยันสิทธิ์และช่องทางชำระเงินที่คุณเลือก
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
