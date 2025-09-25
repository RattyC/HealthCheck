type Pkg = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  gender: string | null;
  category: string[];
  hospital: { id: string; name: string; logoUrl: string | null };
  _count?: { includes: number };
};

import Link from "next/link";

export default function PackageCard({ pkg }: { pkg: Pkg }) {
  const count = pkg._count?.includes ?? 0;
  return (
    <Link
      prefetch
      href={`/packages/${pkg.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded bg-slate-100 dark:bg-slate-700" />
        <div>
          <h3 className="font-medium leading-tight text-slate-900 dark:text-white">{pkg.title}</h3>
          <div className="text-xs text-slate-500 dark:text-slate-400">{pkg.hospital.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">฿{pkg.basePrice.toLocaleString()}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{count} รายการตรวจ</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-600 dark:text-slate-300">
        {pkg.category?.slice(0, 3).map((c) => (
          <span key={c} className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
            {c}
          </span>
        ))}
        {pkg.gender && pkg.gender !== "any" && (
          <span className="rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
            {pkg.gender}
          </span>
        )}
      </div>
    </Link>
  );
}
