import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = {
  title: "ลืมรหัสผ่าน | HealthCheck CM Price",
};

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center space-y-6 rounded-xl border border-slate-200 bg-white/90 p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ลืมรหัสผ่าน</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          ป้อนอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        จำรหัสผ่านได้แล้ว? <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">กลับไปเข้าสู่ระบบ</Link>
      </p>
    </section>
  );
}
