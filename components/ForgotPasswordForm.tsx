"use client";

import { useState, FormEvent } from "react";

export default function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!email) {
      setError("กรุณากรอกอีเมล");
      return;
    }
    setStatus("loading");
    setError(null);
    setToken(null);
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus("idle");
    if (!response.ok) {
      setError("ไม่สามารถส่งคำขอได้ กรุณาลองใหม่");
      return;
    }
    const payload = (await response.json()) as { token?: string };
    if (payload.token) {
      setToken(payload.token);
    }
    setStatus("success");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          อีเมลที่ลงทะเบียนไว้
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      {status === "success" && (
        <div className="rounded-md border border-emerald-300/60 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200">
          หากอีเมลอยู่ในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่านภายในไม่กี่นาที
          {token && (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">
              (dev) ลิงก์ตัวอย่าง: <span className="font-mono">/auth/reset/{token}</span>
            </p>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ต"}
      </button>
    </form>
  );
}
