"use client";

import { useState, FormEvent } from "react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setStatus("loading");
    setError(null);
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setStatus("idle");
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "เกิดข้อผิดพลาด" }));
      setError(data.error ?? "ไม่สามารถอัปเดตรหัสผ่านได้");
      return;
    }
    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          รหัสผ่านใหม่
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {status === "success" && (
        <p className="rounded-md border border-emerald-300/60 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200">
          อัปเดตรหัสผ่านเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
