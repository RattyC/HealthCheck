"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

export default function AuthSignInForm() {
  const search = useSearchParams();
  const { push } = useToast();
  const callbackUrl = search.get("callbackUrl") ?? "/";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(search.get("error"));
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "").trim();

    if (!email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    setLoading(false);

    if (!result || result.error) {
      const message = result?.error ?? "ไม่สามารถเข้าสู่ระบบได้";
      setError(message);
      push({ title: message, variant: "error" });
      return;
    }

    const destination = result.url ?? callbackUrl;
    push({ title: "เข้าสู่ระบบสำเร็จ", variant: "success" });
    window.location.assign(destination);
  }

  return (
    <form onSubmit={handleSubmit} className="sign-in-form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          อีเมล
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          className="form-input"
          placeholder="you@example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          รหัสผ่าน
        </label>
        <div className="form-input-wrapper">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="form-input"
            placeholder="รหัสผ่าน"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="password-toggle"
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="form-helpers">
          <label className="checkbox">
            <input type="checkbox" name="remember" />
            จดจำฉันบนอุปกรณ์นี้
          </label>
          <Link href="/auth/forgot-password" className="btn-link">
            ลืมรหัสผ่าน?
          </Link>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังเข้าสู่ระบบ...
          </>
        ) : (
          "เข้าสู่ระบบ"
        )}
      </button>
    </form>
  );
}
