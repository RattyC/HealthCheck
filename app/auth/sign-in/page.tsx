import Link from "next/link";
import AuthSignInForm from "@/components/AuthSignInForm";

export const metadata = {
  title: "เข้าสู่ระบบ | HealthCheck CM Price",
};

export default function SignInPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center space-y-6 rounded-xl border border-slate-200 bg-white/90 p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">เข้าสู่ระบบ</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          ใช้บัญชี demo: <span className="font-medium">admin@healthcheck.local</span> / <span className="font-mono">admin1234</span>
        </p>
      </div>
      <AuthSignInForm />
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        ลืมรหัสผ่าน? <Link href="/support/contact" className="font-medium text-brand hover:underline">ติดต่อทีมงาน</Link>
      </p>
    </section>
  );
}
