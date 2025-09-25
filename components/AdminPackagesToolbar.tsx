"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Defaults = {
  q: string;
  status: string;
  sort: string;
  limit: number;
};

const statusOptions = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "ARCHIVED", label: "Archived" },
];

const sortOptions = [
  { value: "updatedDesc", label: "อัปเดตล่าสุด" },
  { value: "updatedAsc", label: "อัปเดตเก่าสุด" },
  { value: "priceAsc", label: "ราคาต่ำ → สูง" },
  { value: "priceDesc", label: "ราคาสูง → ต่ำ" },
  { value: "titleAsc", label: "ชื่อ A → Z" },
];

export default function AdminPackagesToolbar({ total, defaults }: { total: number; defaults: Defaults }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(defaults.q);
  const [status, setStatus] = useState(defaults.status);
  const [sort, setSort] = useState(defaults.sort);
  const [limit, setLimit] = useState(String(defaults.limit));

  useEffect(() => {
    setQ(defaults.q);
    setStatus(defaults.status);
    setSort(defaults.sort);
    setLimit(String(defaults.limit));
  }, [defaults]);

  const nextQuery = useMemo(() => {
    const sp = new URLSearchParams(params.toString());
    q ? sp.set("q", q) : sp.delete("q");
    status && status !== "all" ? sp.set("status", status) : sp.delete("status");
    sort ? sp.set("sort", sort) : sp.delete("sort");
    limit ? sp.set("limit", limit) : sp.delete("limit");
    sp.delete("page");
    return sp.toString();
  }, [params, q, status, sort, limit]);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="grow">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            ค้นหา
          </label>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="ชื่อแพ็กเกจหรือโรงพยาบาล"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-wrap gap-3 md:flex-nowrap">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              สถานะ
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              เรียงตาม
            </label>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              ต่อหน้า
            </label>
            <select
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {[10, 20, 50, 100].map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500 dark:text-slate-300">{total.toLocaleString()} แพ็กเกจทั้งหมด</div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const target = nextQuery ? `${pathname}?${nextQuery}` : pathname;
              router.push(target);
            }}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 dark:focus:ring-offset-slate-950"
          >
            ใช้ตัวกรอง
          </button>
          <button
            onClick={() => router.push(pathname)}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            รีเซ็ต
          </button>
        </div>
      </div>
    </div>
  );
}
