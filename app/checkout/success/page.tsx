import Link from "next/link";
import { CheckCircle, Info } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import { buildPaymentInstructions, getPaymentGuide, resolvePaymentMethod } from "@/lib/payments";
import { logger } from "@/lib/logger";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderIdParam = params.orderId;
  const refParam = params.ref;
  const methodParam = params.method;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam ?? null;
  const fallbackRef = Array.isArray(refParam) ? refParam[0] : refParam ?? null;
  const fallbackMethod = Array.isArray(methodParam) ? methodParam[0] : methodParam ?? null;

  const user = await requireUser("/checkout/success");

  type OrderWithItems = Prisma.OrderGetPayload<{
    include: {
      items: {
        include: {
          package: { select: { id: true; slug: true } };
        };
      };
    };
  }>;

  let order: OrderWithItems | null = null;
  let loadError: string | null = null;

  if (orderId) {
    try {
      order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        include: {
          items: {
            include: {
              package: { select: { id: true, slug: true } },
            },
          },
        },
      });
    } catch (error) {
      loadError = "ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้";
      logger.error("checkout.success.load_failed", { error: `${error}`, orderId, userId: user.id });
    }
  }

  const referenceCode = order?.referenceCode ?? fallbackRef ?? "-";
  const resolvedMethod = resolvePaymentMethod(order?.paymentMethod ?? fallbackMethod);
  const paymentInstruction = order
    ? buildPaymentInstructions(resolvedMethod, order.paymentStatus, order.totalAmount, order.referenceCode)
    : null;
  const paymentGuide = getPaymentGuide(resolvedMethod);
  const items: OrderWithItems["items"] = order?.items ?? [];

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
          <CheckCircle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">บันทึกคำสั่งซื้อเรียบร้อย</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          ทีมงานจะติดต่อกลับเพื่อยืนยันสิทธิ์และขั้นตอนชำระเงินตามช่องทางที่คุณเลือกเร็วที่สุด
        </p>
      </header>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">รหัสอ้างอิงคำสั่งซื้อ</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">กรุณาแจ้งรหัสนี้เมื่อพูดคุยกับเจ้าหน้าที่</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {referenceCode}
          </div>
        </div>

        {loadError ? (
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/50 dark:bg-amber-900/20 dark:text-amber-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              {loadError} หากต้องการข้อมูลเพิ่มเติมสามารถอ้างอิงรหัสคำสั่งซื้อให้เจ้าหน้าที่ตรวจสอบได้ทันที
            </p>
          </div>
        ) : null}

        {order ? (
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-4">
              <section>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">แพ็กเกจที่จองไว้</h3>
                <ul className="mt-3 space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{item.packageTitle}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{item.hospitalName ?? "ไม่ระบุโรงพยาบาล"}</div>
                          {item.promotionLabel ? (
                            <div className="text-xs text-brand">โปรโมชั่น: {item.promotionLabel}</div>
                          ) : null}
                          {item.scheduledFor ? (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              วันรับบริการ: {new Date(item.scheduledFor).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                          <div>จำนวน {item.quantity}</div>
                          <div className="font-semibold text-slate-900 dark:text-white">{currency.format(item.unitPrice)}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">สถานะการชำระเงิน</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">ช่องทาง: {paymentGuide.label}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">สถานะ: {order.paymentStatus}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">จำนวนเงิน: {currency.format(order.totalAmount)}</p>
                {paymentInstruction ? (
                  <div className="mt-3 space-y-2 rounded-lg bg-white/60 p-3 text-xs text-slate-600 shadow-inner dark:bg-slate-800/70 dark:text-slate-300">
                    <p className="font-medium text-slate-700 dark:text-slate-200">สิ่งที่ต้องทำ:</p>
                    <ul className="space-y-1">
                      {paymentGuide.steps.map((step) => (
                        <li key={step}>• {step}</li>
                      ))}
                    </ul>
                    <p className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">{paymentInstruction.note}</p>
                  </div>
                ) : null}
              </section>
            </div>

            <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">ขั้นตอนถัดไป</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>• ทีมงานจะโทรหรือส่งข้อความภายใน 1 ชั่วโมงเพื่อยืนยันรายละเอียด</li>
                <li>• เตรียมเอกสารที่จำเป็น เช่น บัตรประชาชน และผลตรวจที่ผ่านมา (ถ้ามี)</li>
                <li>• เผื่อเวลาในวันตรวจอย่างน้อย 2-3 ชั่วโมง</li>
              </ul>
            </aside>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
            ไม่พบรายละเอียดคำสั่งซื้อในระบบ แต่เราได้รับคำขอไว้แล้ว กรุณาติดต่อเจ้าหน้าที่พร้อมแจ้งรหัส {referenceCode}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          ไปที่แดชบอร์ดของฉัน
        </Link>
        <Link
          href="/packages"
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          เลือกแพ็กเกจเพิ่มเติม
        </Link>
      </div>
    </section>
  );
}
