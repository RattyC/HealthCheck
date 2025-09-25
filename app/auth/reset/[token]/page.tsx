import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata = {
  title: "ตั้งรหัสผ่านใหม่ | HealthCheck CM Price",
};

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center space-y-6 rounded-xl border border-slate-200 bg-white/90 p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ตั้งรหัสผ่านใหม่</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">กำหนดรหัสผ่านใหม่เพื่อใช้งานบัญชีของคุณ</p>
      </div>
      <ResetPasswordForm token={params.token} />
    </section>
  );
}
