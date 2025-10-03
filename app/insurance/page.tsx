import Link from "next/link";
import { Shield, ArrowRight, PhoneCall } from "lucide-react";
import { getInsuranceBundles } from "@/lib/insurance-data";

const currency = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export const metadata = {
  title: "แพ็กเกจประกัน + ตรวจสุขภาพ | HealthCheck CM Price",
};

export default function InsurancePage() {
  const bundles = getInsuranceBundles();
  return (
    <section className="space-y-10">
      <header className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Shield className="h-4 w-4" aria-hidden />
              แพ็กเกจตรวจสุขภาพ + ประกันสุขภาพ
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">ครบทั้งการตรวจและความคุ้มครองในงบเดียว</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              เลือกแพ็กเกจตรวจสุขภาพพร้อมประกันอุบัติเหตุหรือสุขภาพจากพันธมิตรชั้นนำ ทีมงานจะช่วยเปรียบเทียบ คำนวณเบี้ย และเตรียมเอกสารให้ครบในครั้งเดียว
            </p>
          </div>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            ปรึกษาเจ้าหน้าที่ทันที
          </Link>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map((bundle) => (
          <article key={bundle.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{bundle.name}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">พันธมิตร: {bundle.partner}</p>
              </div>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">ตอบกลับภายใน {bundle.responseTimeHours} ชม.</span>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{bundle.coverage}</p>
            <div className="mt-3 text-sm font-semibold text-brand">เริ่มต้น {currency.format(bundle.price)}/เดือน</div>
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{bundle.highlight}</p>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">เหมาะสำหรับ: {bundle.idealFor}</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {bundle.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <span aria-hidden>•</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            {bundle.qualifyingPackages.length > 0 ? (
              <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-300">
                คุณสมบัติ: ต้องมีผลตรวจครบจากแพ็กเกจ {bundle.qualifyingPackages.map((option, index) => (
                  <span key={option.slug}>
                    <Link href={`/packages/${option.slug}`} className="underline">
                      {option.label}
                    </Link>
                    {index < bundle.qualifyingPackages.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <Link
                href={`/insurance/${bundle.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ดูรายละเอียดเพิ่มเติม
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={`/checkout?bundle=${bundle.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                ขอใบเสนอราคา
              </Link>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-lg dark:border-slate-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">ต้องการคำปรึกษาแบบเฉพาะเจาะจง?</h2>
            <p className="mt-1 text-sm text-white/80">ทีมผู้เชี่ยวชาญพร้อมช่วยออกแบบแพ็กเกจสุขภาพและประกันให้เหมาะกับองค์กรหรือครอบครัวของคุณ</p>
          </div>
          <Link
            href="tel:020000000"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <PhoneCall className="h-4 w-4" aria-hidden /> โทรเลย 02-000-0000
          </Link>
        </div>
      </section>
    </section>
  );
}
