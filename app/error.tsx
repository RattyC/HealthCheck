'use client';

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const message = error?.message?.trim() || "Server error";
  const digest = error?.digest ? ` (Digest: ${error.digest})` : "";

  return (
    <div className="container-page py-10">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">เกิดข้อผิดพลาดขณะโหลดหน้า</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {message}
        {digest}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ลองอีกครั้ง
        </button>
        <Link
          href="/"
          className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
