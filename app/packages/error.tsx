"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PackagesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("packages.error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-600 shadow-sm dark:border-rose-500/50 dark:bg-rose-500/10 dark:text-rose-200">
      <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาดในการโหลดแพ็กเกจ</h1>
      <p className="text-sm">
        เรากำลังเชื่อมต่อข้อมูลจากฐานอยู่ชั่วคราว กรุณารีเฟรชหน้า หรือกลับไปที่หน้าแรกเพื่อค้นหาแพ็กเกจอีกครั้ง
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2 font-semibold text-white transition hover:bg-brand-dark"
        >
          ลองใหม่อีกครั้ง
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-2 font-medium text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
