"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

export default function FilterBar({ hospitals }: { hospitals: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [hospitalId, setHospitalId] = useState(params.get("hospitalId") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "priceAsc");

  useEffect(() => {
    setQ(params.get("q") ?? "");
    setHospitalId(params.get("hospitalId") ?? "");
    setSort(params.get("sort") ?? "priceAsc");
  }, [params]);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams(params.toString());
    if (q) sp.set("q", q); else sp.delete("q");
    if (hospitalId) sp.set("hospitalId", hospitalId); else sp.delete("hospitalId");
    if (sort) sp.set("sort", sort);
    sp.delete("page"); // reset page
    return sp.toString();
  }, [q, hospitalId, sort, params]);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหาชื่อแพ็กเกจ/รายการตรวจ"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand sm:max-w-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      />
      <select
        value={hospitalId}
        onChange={(e) => setHospitalId(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        <option value="">ทุกโรงพยาบาล</option>
        {hospitals.map((h) => (
          <option key={h.value} value={h.value}>{h.label}</option>
        ))}
      </select>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        <option value="priceAsc">ราคาต่ำ → สูง</option>
        <option value="priceDesc">ราคาสูง → ต่ำ</option>
        <option value="updated">อัปเดตล่าสุด</option>
      </select>
      <div className="ml-auto flex gap-2">
        <button
          onClick={() => router.push(`${pathname}?${queryString}`)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 dark:focus:ring-offset-slate-950"
        >
          ใช้ฟิลเตอร์
        </button>
        <button
          onClick={() => router.push(pathname)}
          className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ล้างค่า
        </button>
      </div>
    </div>
  );
}
