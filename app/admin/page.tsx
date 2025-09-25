import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export default async function AdminHome() {
  let counts = { DRAFT: 0, APPROVED: 0, ARCHIVED: 0 } as Record<string, number>;
  try {
    const [draft, approved, archived] = await Promise.all([
      prisma.healthPackage.count({ where: { status: "DRAFT" } }),
      prisma.healthPackage.count({ where: { status: "APPROVED" } }),
      prisma.healthPackage.count({ where: { status: "ARCHIVED" } }),
    ]);
    counts = { DRAFT: draft, APPROVED: approved, ARCHIVED: archived };
  } catch {}

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-500 dark:text-slate-300">Draft</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">{counts.DRAFT}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-500 dark:text-slate-300">Approved</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">{counts.APPROVED}</div>
        </div>
        <div className="rounded border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-sm text-slate-500 dark:text-slate-300">Archived</div>
          <div className="text-2xl font-semibold text-slate-900 dark:text-white">{counts.ARCHIVED}</div>
        </div>
      </div>
      <div>
        <Link
          href="/admin/packages"
          className="inline-flex items-center rounded bg-brand px-3 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 dark:focus:ring-offset-slate-950"
        >
          จัดการแพ็กเกจ
        </Link>
      </div>
    </section>
  );
}
