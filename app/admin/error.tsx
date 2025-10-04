"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("admin.error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-slate-300 bg-white p-8 text-center text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาดในศูนย์ควบคุม</h1>
      <p className="text-sm">
        เรากำลังรีเฟรชข้อมูลให้ใหม่ กรุณาลองอีกครั้ง หรือกลับไปหน้าหลักของผู้ใช้ชั่วคราว
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 font-semibold text-white transition hover:bg-brand-dark"
        >
          ลองโหลดแดชบอร์ดอีกครั้ง
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          กลับหน้าลูกค้า
        </Link>
      </div>
    </div>
  );
}
