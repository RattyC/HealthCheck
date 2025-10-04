"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CompareError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("compare.error", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-800 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-200">
      <h1 className="text-2xl font-semibold">ไม่สามารถเปรียบเทียบแพ็กเกจได้ชั่วคราว</h1>
      <p className="text-sm">
        ระบบอาจรับข้อมูลจำนวนมาก กรุณาลองใหม่ หรือเลือกแพ็กเกจอีกครั้ง
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-2 font-semibold text-white transition hover:bg-amber-600"
        >
          ลองเปรียบเทียบใหม่
        </button>
        <Link
          href="/packages"
          className="inline-flex items-center justify-center rounded-full border border-amber-400 px-5 py-2 font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-200 dark:hover:bg-amber-500/10"
        >
          กลับไปเลือกแพ็กเกจ
        </Link>
      </div>
    </div>
  );
}
