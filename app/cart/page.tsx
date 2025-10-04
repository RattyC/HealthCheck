// Authenticated cart summary where users review, remove, and proceed with selected packages.
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import RemoveCartItemButton from "@/components/RemoveCartItemButton";
import { resolveHospitalLogo } from "@/lib/hospital-logos";

export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        package: {
          select: {
            id: true;
            title: true;
            slug: true;
            basePrice: true;
            hospital: { select: { id: true; name: true; logoUrl: true } };
          };
        };
      };
      orderBy: { addedAt: "desc" };
    };
  };
}>;

export default async function CartPage() {
  const user = await requireUser("/cart");

  let items: CartWithItems["items"] | undefined;
  let cartError: string | null = null;

  try {
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
    items = cart?.items ?? [];
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      cartError = "ยังไม่ได้สร้างตารางตะกร้าในฐานข้อมูล กรุณารัน prisma migrate ก่อนใช้งาน";
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      cartError = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบ DATABASE_URL";
    } else {
      cartError = "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้า";
    }
  }

  const list = items ?? [];
  const total = list.reduce((sum, item) => sum + item.quantity * item.package.basePrice, 0);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ตะกร้าแพ็กเกจสุขภาพ</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">จัดการแพ็กเกจที่คุณต้องการสอบถามหรือจองกับโรงพยาบาล</p>
      </header>

      {cartError ? (
        <div className="rounded-2xl border border-dashed border-rose-300 bg-rose-50/80 p-10 text-center text-rose-600 shadow-sm dark:border-rose-500/70 dark:bg-rose-500/10 dark:text-rose-200">
          <p className="text-base font-medium">{cartError}</p>
          <p className="mt-2 text-sm">
            ตั้งค่า `DATABASE_URL` ให้ถูกต้อง จากนั้นรัน <code>npx prisma migrate deploy</code> และ <code>npm run prisma:seed</code>
          </p>
        </div>
      ) : list.length === 0 ? (
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
            {list.map((item) => {
              const hospital = item.package.hospital;
              const hospitalLogo = resolveHospitalLogo({
                id: hospital?.id ?? null,
                name: hospital?.name ?? null,
                logoUrl: hospital?.logoUrl ?? null,
              });
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/70"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          {hospitalLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={hospitalLogo} alt={hospital?.name ?? "โลโก้โรงพยาบาล"} className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-300">
                              {(hospital?.name ?? "รพ").slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Link
                            href={`/packages/${item.package.slug ?? item.package.id}`}
                            className="text-base font-semibold text-slate-900 hover:text-brand dark:text-white dark:hover:text-brand/80"
                          >
                            {item.package.title}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{hospital?.name ?? "ไม่ระบุโรงพยาบาล"}</div>
                        </div>
                      </div>
                    {item.promotionLabel ? (
                      <div className="text-xs text-brand">
                        ใช้โปรโมชั่น: {item.promotionLabel}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600 dark:text-amber-300">
                        ยังไม่ได้เลือกโปรโมชั่น • <Link href={`/packages/${item.package.slug ?? item.package.id}`} className="underline">เลือกเลย</Link>
                      </div>
                    )}
                    {item.scheduledFor ? (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        วันรับบริการ: {new Date(item.scheduledFor).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500 dark:text-rose-300">
                        กรุณาจองวันรับบริการก่อนชำระเงิน • <Link href={`/packages/${item.package.slug ?? item.package.id}`} className="underline">จองวัน</Link>
                      </div>
                    )}
                  </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                        <div>จำนวน: {item.quantity}</div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {currency.format(item.package.basePrice * item.quantity)}
                        </div>
                      </div>
                      <RemoveCartItemButton packageId={item.package.id} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">สรุปตะกร้า</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <dt>จำนวนแพ็กเกจ</dt>
                <dd>{list.length} รายการ</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>รวมทั้งหมด</dt>
                <dd className="text-base font-semibold text-slate-900 dark:text-white">{currency.format(total)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              ทีมงานจะติดต่อคุณเพื่อยืนยันรายละเอียดแพ็กเกจและโปรโมชั่นจากโรงพยาบาลที่เกี่ยวข้อง
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                ไปหน้าชำระเงิน/ยืนยันคำสั่งซื้อ
              </Link>
              <Link
                href="/support/contact"
                className="flex w-full items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ติดต่อทีมดูแลลูกค้า
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
