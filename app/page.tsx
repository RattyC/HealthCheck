import Link from "next/link";
import { Search, Sparkles, Shield, Star, HeartPulse } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const DB_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_DB_TIMEOUT ?? 2500);

function withTimeout<T>(promise: Promise<T>, fallback: T, label: string, timeout = DB_TIMEOUT_MS): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      logger.warn(`${label}.timeout`, { timeout });
      resolve(fallback);
    }, timeout);
  });

  return Promise.race([
    promise
      .then((result) => {
        clearTimeout(timer);
        return result;
      })
      .catch((error) => {
        clearTimeout(timer);
        logger.error(`${label}.failed`, { error: `${error}` });
        return fallback;
      }),
    timeoutPromise,
  ]);
}

const quickFilters = [
  { label: "ราคาต่ำกว่า 3,000", href: "/packages?maxPrice=3000", emoji: "💸" },
  { label: "สำหรับผู้หญิง", href: "/packages?gender=female", emoji: "👩" },
  { label: "สำหรับผู้ชาย", href: "/packages?gender=male", emoji: "👨" },
  { label: "Executive Checkup", href: "/packages?category=executive", emoji: "🏆" },
  { label: "ตรวจสุขภาพผู้สูงอายุ", href: "/packages?category=senior", emoji: "👵" },
];

const featureHighlights = [
  {
    title: "ค้นหาง่าย ครอบคลุม",
    description: "รวบรวมแพ็กเกจจากโรงพยาบาลในเชียงใหม่กว่า 20 แห่ง พร้อมฟิลเตอร์ที่ละเอียด",
    icon: <Search className="h-5 w-5" aria-hidden />,
  },
  {
    title: "อัปเดตราคาเสมอ",
    description: "เห็นราคาล่าสุด รายการตรวจ และหมายเหตุพิเศษแบบเรียลไทม์",
    icon: <Sparkles className="h-5 w-5" aria-hidden />,
  },
  {
    title: "กราฟแนวโน้มราคา",
    description: "เปรียบเทียบราคาในอดีตพร้อมข้อมูลสถิติความนิยม",
    icon: <Star className="h-5 w-5" aria-hidden />,
  },
  {
    title: "ซื้อประกันได้ในที่เดียว",
    description: "เลือกแพ็กเกจพร้อมประกันสุขภาพหรืออุบัติเหตุจากพันธมิตรของเรา",
    icon: <Shield className="h-5 w-5" aria-hidden />,
  },
];

const insuranceBundles = [
  {
    id: "health-protect",
    name: "Health Protect Plus",
    price: 890,
    coverage: "คุ้มครองค่ารักษาพยาบาล 200,000 บาท/ปี + ตรวจสุขภาพประจำปี",
    partner: "Allianz Ayudhya",
    highlight: "ลด 10% เมื่อซื้อคู่กับแพ็กเกจ Premium Checkup",
  },
  {
    id: "senior-care",
    name: "Senior Care Combo",
    price: 1_290,
    coverage: "ประกันอุบัติเหตุ + ตรวจสุขภาพผู้สูงอายุ (เฉพาะ 55+)",
    partner: "เมืองไทยประกันภัย",
    highlight: "แนะนำสำหรับครอบครัวดูแลผู้สูงวัย",
  },
  {
    id: "family-shield",
    name: "Family Shield Plan",
    price: 1_590,
    coverage: "ตรวจสุขภาพผู้ปกครอง + คุ้มครองลูกเล็กจากอุบัติเหตุ",
    partner: "AXA",
    highlight: "แบ่งจ่าย 0% 6 เดือน 💳",
  },
];

function HeroSearch() {
  return (
    <form action="/packages" className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-brand dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" aria-hidden />
        <input
          name="q"
          placeholder="ค้นหาแพ็กเกจหรือโรงพยาบาล..."
          className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:text-slate-200"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-white shadow transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
      >
        เริ่มค้นหา
      </button>
    </form>
  );
}

export default async function HomePage() {
  const [topPackages, hospitals] = await Promise.all([
    withTimeout(
      prisma.healthPackage.findMany({
        where: { status: "APPROVED" },
        include: {
          hospital: { select: { name: true, logoUrl: true } },
          metrics: true,
        },
        orderBy: [{ metrics: { viewCount: "desc" } }, { updatedAt: "desc" }],
        take: 6,
      }),
      [],
      "homepage.top-packages"
    ),
    withTimeout(
      prisma.hospital.findMany({
        include: { _count: { select: { packages: true } } },
        orderBy: { packages: { _count: "desc" } },
        take: 6,
      }),
      [],
      "homepage.hospitals"
    ),
  ]);

  const hasPackages = topPackages.length > 0;
  const hasHospitals = hospitals.length > 0;

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-4 pb-16 pt-12">
      <section className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
          <HeartPulse className="h-3.5 w-3.5" aria-hidden />
          <span>ตรวจสุขภาพ + ประกันครบในที่เดียว</span>
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          เปรียบเทียบแพ็กเกจตรวจสุขภาพในเชียงใหม่ได้ง่าย ๆ
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
          ค้นหาราคา รายการตรวจ และโปรโมชันล่าสุด พร้อมเลือกประกันสุขภาพ/อุบัติเหตุที่เหมาะกับคุณ
        </p>
        <div className="mt-8">
          <HeroSearch />
        </div>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          หรือ <Link href="/packages" className="font-medium text-brand hover:underline">ดูแพ็กเกจทั้งหมด</Link> / <Link href="/insurance" className="font-medium text-brand hover:underline">เปรียบเทียบประกันสุขภาพ</Link>
        </div>
      </section>

      <section aria-labelledby="quick-filters" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="quick-filters" className="text-lg font-semibold text-slate-900 dark:text-white">ค้นหาเร็วตามหมวดที่ได้รับความนิยม</h2>
          <Link href="/packages" className="text-sm font-medium text-brand hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Link
              key={filter.href}
              href={filter.href}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-brand hover:text-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <span aria-hidden>{filter.emoji}</span>
              {filter.label}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="top-packages" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="top-packages" className="text-lg font-semibold text-slate-900 dark:text-white">แพ็กเกจยอดนิยม</h2>
          <Link href="/packages?sort=updated" className="text-sm font-medium text-brand hover:underline">
            ดูแพ็กเกจทั้งหมด
          </Link>
        </div>
        {hasPackages ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPackages.map((pkg) => (
              <article key={pkg.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{pkg.title}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{pkg.hospital?.name ?? "ไม่ระบุโรงพยาบาล"}</p>
                  </div>
                  {pkg.metrics?.viewCount ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                      ⭐ ยอดดู {pkg.metrics.viewCount}
                    </span>
                  ) : null}
                </div>
                <dl className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <dt>ราคาเริ่มต้น</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">{currency.format(pkg.basePrice)}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>อัปเดตล่าสุด</dt>
                    <dd>{pkg.updatedAt.toLocaleDateString("th-TH")}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <Link
                    href={`/packages/${pkg.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    ดูรายละเอียด
                  </Link>
                  <Link
                    href={`/compare?add=${pkg.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand hover:text-white"
                  >
                    เปรียบเทียบ
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="ยังไม่มีข้อมูลแพ็กเกจ" hint="กำลังรอข้อมูลล่าสุดจากโรงพยาบาล" />
        )}
      </section>

      <section aria-labelledby="insurance-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="insurance-section" className="text-lg font-semibold text-slate-900 dark:text-white">แพ็กเกจ + ประกันสุขภาพ / อุบัติเหตุ</h2>
          <Link href="/insurance" className="text-sm font-medium text-brand hover:underline">
            ดูรายละเอียดทั้งหมด
          </Link>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          เลือกแพ็กเกจตรวจสุขภาพพร้อมประกันที่เหมาะกับคุณในงบเดียว ติดต่อเจ้าหน้าที่เพื่อขอใบเสนอราคาได้ฟรี
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {insuranceBundles.map((bundle) => (
            <article key={bundle.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{bundle.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">พันธมิตร: {bundle.partner}</p>
                </div>
                <Shield className="h-5 w-5 text-brand" aria-hidden />
              </div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{bundle.coverage}</p>
              <div className="mt-4 text-sm font-semibold text-brand">เริ่มต้น {currency.format(bundle.price)}/เดือน</div>
              <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{bundle.highlight}</p>
              <div className="mt-6 flex items-center gap-2 text-sm">
                <Link
                  href={`/insurance/${bundle.id}`}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  ดูรายละเอียด
                </Link>
                <Link
                  href={`/insurance/${bundle.id}?action=contact`}
                  className="inline-flex items-center justify-center rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  ขอใบเสนอราคา
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="top-hospitals" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 id="top-hospitals" className="text-lg font-semibold text-slate-900 dark:text-white">โรงพยาบาลพันธมิตร</h2>
          <Link href="/packages?sort=popular" className="text-sm font-medium text-brand hover:underline">
            ดูโรงพยาบาลทั้งหมด
          </Link>
        </div>
        {hasHospitals ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hospitals.map((hospital) => (
              <article key={hospital.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {(hospital.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hospital.logoUrl} alt={hospital.name} className="h-12 w-12 rounded-full object-cover" />
                  )) || hospital.name.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-white">{hospital.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">มีแพ็กเกจ {hospital._count.packages} รายการ</p>
                </div>
                <Link href={`/packages?hospitalId=${hospital.id}`} className="text-sm font-medium text-brand hover:underline">
                  ดูแพ็กเกจ
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="ยังไม่มีข้อมูลโรงพยาบาล" hint="กำลังจัดเตรียมข้อมูลล่าสุด" />
        )}
      </section>

      <section aria-labelledby="feature-highlights" className="space-y-6">
        <h2 id="feature-highlights" className="text-lg font-semibold text-slate-900 dark:text-white">ทำไมถึงควรใช้ HealthCheck CM Price?</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featureHighlights.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-to-r from-brand via-brand/90 to-brand-dark px-6 py-10 text-center text-white shadow-lg">
        <h2 className="text-2xl font-semibold">พร้อมเริ่มต้นดูแลสุขภาพและความคุ้มครองของคุณแล้วหรือยัง?</h2>
        <p className="mt-3 text-sm text-white/80">ค้นหาแพ็กเกจ ตรวจสอบโปรโมชั่น และรับคำแนะนำจากผู้เชี่ยวชาญฟรี</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/packages" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow hover:bg-slate-100">
            เริ่มค้นหาแพ็กเกจสุขภาพ
          </Link>
          <Link href="/insurance" className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
            ดูประกันสุขภาพและอุบัติเหตุ
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 pt-8 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-semibold text-slate-900 dark:text-white">
              HealthCheck CM Price
            </Link>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              แหล่งข้อมูลแพ็กเกจตรวจสุขภาพและประกันครบวงจรสำหรับคนเชียงใหม่
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ลิงก์สำคัญ</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/about" className="hover:text-brand">เกี่ยวกับเรา</Link></li>
              <li><Link href="/blog" className="hover:text-brand">บทความ</Link></li>
              <li><Link href="/contact" className="hover:text-brand">ติดต่อทีมงาน</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ข้อกำหนด</h3>
            <ul className="mt-2 space-y-1">
              <li><Link href="/terms" className="hover:text-brand">ข้อกำหนดการใช้งาน</Link></li>
              <li><Link href="/privacy" className="hover:text-brand">นโยบายความเป็นส่วนตัว</Link></li>
              <li><Link href="/insurance/disclosure" className="hover:text-brand">คำเตือนด้านประกันภัย</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">ติดตามเรา</h3>
            <ul className="mt-2 space-y-1">
              <li><a href="https://facebook.com" className="hover:text-brand">Facebook</a></li>
              <li><a href="https://instagram.com" className="hover:text-brand">Instagram</a></li>
              <li><a href="mailto:hello@healthcheck.cm" className="hover:text-brand">hello@healthcheck.cm</a></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} HealthCheck CM Price · Chiang Mai, Thailand
        </p>
      </footer>
    </main>
  );
}
