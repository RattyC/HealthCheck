// Sign-in page providing marketing messaging and access to the auth form.
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSignInForm from "@/components/AuthSignInForm";
import { getSession } from "@/lib/session";
import styles from "./SignInLayout.module.css";

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
    <div className={styles.signInShell}>
      <div className={styles.signInGrid}>
        <aside className={styles.signInHero}>
          <div className={styles.signInHeroHeader}>
            <Link href="/" className={styles.signInHeroBrand}>
              HealthCheck CM Price
            </Link>
            <div className={styles.signInHeroHeadline}>
              <h1 className={styles.signInHeroTitle}>เข้าสู่ระบบเพื่อจัดการแพ็กเกจสุขภาพของคุณ</h1>
              <p className={styles.signInHeroDescription}>
                จัดการข้อมูลโรงพยาบาล เปรียบเทียบแพ็กเกจ และดูสถิติยอดนิยมแบบเรียลไทม์ บนแพลตฟอร์มเดียวที่ออกแบบมาเพื่อเชียงใหม่โดยเฉพาะ
              </p>
            </div>
            <ul className={styles.signInHeroList}>
              {checklist.map((item) => (
                <li key={item} className={styles.signInHeroItem}>
                  <span className={styles.signInHeroItemBullet}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.signInHeroFooter}>
            <div>
              <p className="text-sm text-slate-200/90">บัญชีลูกค้าทดลอง</p>
              <p>
                <span className="font-medium">user@healthcheck.local</span>
                <span className="ml-2 font-mono text-xs">รหัสผ่าน: user1234</span>
              </p>
            </div>
            <div className="mt-3">
              <p className="text-sm text-slate-200/90">บัญชีผู้ดูแลระบบ</p>
              <p>
                <span className="font-medium">admin@healthcheck.local</span>
                <span className="ml-2 font-mono text-xs">รหัสผ่าน: admin1234</span>
              </p>
            </div>
          </div>
        </aside>

        <section className={styles.signInFormPanel}>
          <div className={styles.signInFormPanelIntro}>
            <h2 className={styles.signInFormPanelTitle}>ยินดีต้อนรับกลับ</h2>
            <p className={styles.signInFormPanelSubtitle}>
              เข้าสู่ระบบเพื่อเริ่มจัดการแพ็กเกจ วิเคราะห์ข้อมูล และส่งต่อข้อมูลให้ทีมของคุณ
            </p>
          </div>
          <AuthSignInForm defaultCallbackUrl="/dashboard" />
          <div className={styles.signInFootnote}>
            ยังไม่มีบัญชี? <Link href="/support/contact">ติดต่อเพื่อขอสิทธิ์เข้าถึง</Link>
            <br />
            ผู้ดูแลระบบ? <Link href="/auth/admin-sign-in">เข้าสู่ระบบสำหรับแอดมิน</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
