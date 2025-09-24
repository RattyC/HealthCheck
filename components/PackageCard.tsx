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
    <Link prefetch href={`/packages/${pkg.id}`} className="block rounded-lg border p-4 hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded bg-gray-100" />
        <div>
          <h3 className="font-medium leading-tight">{pkg.title}</h3>
          <div className="text-xs text-gray-500">{pkg.hospital.name}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold">฿{pkg.basePrice.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{count} รายการตรวจ</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-gray-600">
        {pkg.category?.slice(0, 3).map((c) => (
          <span key={c} className="rounded-full border px-2 py-0.5">{c}</span>
        ))}
        {pkg.gender && pkg.gender !== "any" && (
          <span className="rounded-full border px-2 py-0.5">{pkg.gender}</span>
        )}
      </div>
    </Link>
  );
}
