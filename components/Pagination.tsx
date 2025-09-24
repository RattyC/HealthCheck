"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ page, limit, total }: { page: number; limit: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const go = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button disabled={page <= 1} onClick={() => go(page - 1)} className="rounded border px-3 py-1 disabled:opacity-50">ก่อนหน้า</button>
      <span className="text-sm text-gray-600">หน้า {page} / {pageCount}</span>
      <button disabled={page >= pageCount} onClick={() => go(page + 1)} className="rounded border px-3 py-1 disabled:opacity-50">ถัดไป</button>
    </div>
  );
}

