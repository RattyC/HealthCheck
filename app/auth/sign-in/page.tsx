import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSignInForm from "@/components/AuthSignInForm";
import { getSession } from "@/lib/session";
import "./sign-in.css";

export const metadata = {
  title: "เข้าสู่ระบบ | HealthCheck CM Price",
};

const checklist = [
  "สรุปแพ็กเกจที่บันทึกไว้ในแดชบอร์ดทันที",
  "ติดตามการเปลี่ยนแปลงราคาย้อนหลัง",
  "แชร์ลิงก์เปรียบเทียบให้ทีมของคุณได้ภายในคลิกเดียว",
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/dashboard";
  const session = await getSession();
  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="sign-in-shell">
      <div className="sign-in-grid">
        <aside className="sign-in-hero">
          <div className="sign-in-hero__header">
            <Link href="/" className="sign-in-hero__brand">
              HealthCheck CM Price
            </Link>
            <div className="sign-in-hero__headline">
              <h1 className="sign-in-hero__title">เข้าสู่ระบบเพื่อจัดการแพ็กเกจสุขภาพของคุณ</h1>
              <p className="sign-in-hero__description">
                จัดการข้อมูลโรงพยาบาล เปรียบเทียบแพ็กเกจ และดูสถิติยอดนิยมแบบเรียลไทม์ บนแพลตฟอร์มเดียวที่ออกแบบมาเพื่อเชียงใหม่โดยเฉพาะ
              </p>
            </div>
            <ul className="sign-in-hero__list">
              {checklist.map((item) => (
                <li key={item} className="sign-in-hero__item">
                  <span className="sign-in-hero__item-bullet">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="sign-in-hero__footer">
            <p>Demo สำหรับการทดสอบ: <span className="font-medium">admin@healthcheck.local</span></p>
            <p className="font-mono text-sm">รหัสผ่าน: admin1234</p>
          </div>
        </aside>

        <section className="sign-in-form-panel">
          <div className="sign-in-form-panel__intro">
            <h2 className="sign-in-form-panel__title">ยินดีต้อนรับกลับ</h2>
            <p className="sign-in-form-panel__subtitle">
              เข้าสู่ระบบเพื่อเริ่มจัดการแพ็กเกจ วิเคราะห์ข้อมูล และส่งต่อข้อมูลให้ทีมของคุณ
            </p>
          </div>
          <AuthSignInForm />
          <div className="sign-in-footnote">
            ยังไม่มีบัญชี? <Link href="/support/contact">ติดต่อเพื่อขอสิทธิ์เข้าถึง</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
