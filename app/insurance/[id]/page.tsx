import Link from "next/link";
import { notFound } from "next/navigation";
import { Shield, ArrowRight, CheckCircle, Info } from "lucide-react";
import { findInsuranceBundle } from "@/lib/insurance-data";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logger } from "@/lib/logger";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export default async function InsuranceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = findInsuranceBundle(id);
  if (!bundle) {
    notFound();
  }

  const session = await getSession();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const qualifyingSlugs = bundle.qualifyingPackages.map((item) => item.slug);

  type EligibilityState = "eligible" | "needs_check" | "guest" | "unknown";
  let eligibilityState: EligibilityState = qualifyingSlugs.length === 0 ? "eligible" : "guest";
  let missingPackages = bundle.qualifyingPackages;

  if (qualifyingSlugs.length && userId) {
    try {
      const fulfilled = await prisma.orderItem.findMany({
        where: {
          order: {
            userId,
            OR: [
              { status: { in: ["CONFIRMED", "COMPLETED"] } },
              { paymentStatus: { in: ["PAID"] } },
            ],
          },
          package: { slug: { in: qualifyingSlugs } },
        },
        select: {
          package: { select: { slug: true } },
        },
      });
      const fulfilledSlugs = new Set(fulfilled.map((item) => item.package?.slug).filter(Boolean) as string[]);
      const stillMissing = bundle.qualifyingPackages.filter((item) => !fulfilledSlugs.has(item.slug));
      if (stillMissing.length === 0) {
        eligibilityState = "eligible";
        missingPackages = [];
      } else {
        eligibilityState = "needs_check";
        missingPackages = stillMissing;
      }
    } catch (error) {
      logger.warn("insurance.eligibility_failed", { error: `${error}`, userId, bundleId: bundle.id });
      eligibilityState = "unknown";
    }
  } else if (qualifyingSlugs.length === 0) {
    eligibilityState = "eligible";
    missingPackages = [];
  }

  return (
    <article className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Shield className="h-4 w-4" aria-hidden />
              แพ็กเกจ + ประกันสุขภาพ
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{bundle.name}</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">พันธมิตร: {bundle.partner}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">เหมาะสำหรับ: {bundle.idealFor}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-brand">เริ่มต้น {currency.format(bundle.price)}/เดือน</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">ตอบกลับภายใน {bundle.responseTimeHours} ชั่วโมง</div>
          </div>
        </div>
      </header>

      {qualifyingSlugs.length > 0 ? (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            eligibilityState === "eligible"
              ? "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200"
              : eligibilityState === "needs_check"
              ? "border-rose-300 bg-rose-500/10 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-200"
              : "border-slate-200 bg-slate-100/80 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
          }`}
        >
          {eligibilityState === "eligible" ? <CheckCircle className="mt-0.5 h-4 w-4" aria-hidden /> : <Info className="mt-0.5 h-4 w-4" aria-hidden />}
          <div className="space-y-1">
            {eligibilityState === "eligible" ? (
              <p>คุณเคยตรวจสุขภาพตามเงื่อนไขแล้ว สามารถซื้อประกันชุดนี้ได้ทันที</p>
            ) : eligibilityState === "needs_check" ? (
              <div>
                <p className="font-medium">ยังไม่ครบเงื่อนไข</p>
                <p className="text-xs">
                  ต้องมีผลตรวจจากแพ็กเกจ: {missingPackages.map((item, index) => (
                    <span key={item.slug}>
                      <Link href={`/packages/${item.slug}`} className="underline">
                        {item.label}
                      </Link>
                      {index < missingPackages.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
            ) : eligibilityState === "guest" ? (
              <div>
                <p className="font-medium">เข้าสู่ระบบเพื่อเช็กสิทธิ์</p>
                <p className="text-xs">ล็อกอินเพื่อดูว่าคุณผ่านเงื่อนไขการตรวจสุขภาพแล้วหรือไม่</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">ไม่สามารถตรวจสอบสิทธิ์ได้</p>
                <p className="text-xs">กรุณาลองใหม่อีกครั้งหรือแจ้งเจ้าหน้าที่เพื่อช่วยตรวจสอบข้อมูล</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ความคุ้มครอง & สิ่งที่ได้รับ</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{bundle.coverage}</p>
          <div className="rounded-xl bg-slate-100/80 p-4 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">ไฮไลต์:</p>
            <p className="mt-1 text-sm">{bundle.highlight}</p>
          </div>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {bundle.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 text-brand" aria-hidden />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">ขั้นตอนการเริ่มต้น</h2>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>1. กดขอใบเสนอราคาพร้อมกรอกข้อมูลติดต่อ</li>
            <li>2. ทีมงานจะยืนยันเงื่อนไขและสิทธิ์กับโรงพยาบาล/บริษัทประกัน</li>
            <li>3. ชำระเงินผ่านช่องทางที่สะดวกและรับเอกสารยืนยันทันที</li>
          </ol>
          <div className="space-y-2">
            <Link
              href={
                eligibilityState === "guest"
                  ? `/auth/sign-in?callbackUrl=/insurance/${bundle.id}`
                  : eligibilityState === "needs_check" && missingPackages[0]
                  ? `/packages/${missingPackages[0].slug}`
                  : `/checkout?bundle=${bundle.id}`
              }
              className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/30 ${
                eligibilityState === "needs_check"
                  ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {eligibilityState === "needs_check"
                ? "จองแพ็กเกจตามเงื่อนไข"
                : eligibilityState === "guest"
                ? "เข้าสู่ระบบเพื่อตรวจสอบสิทธิ์"
                : "ขอใบเสนอราคาและจองสิทธิ์ทันที"}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/insurance"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              กลับไปดูแพ็กเกจอื่น
            </Link>
          </div>
        </aside>
      </section>
    </article>
  );
}
