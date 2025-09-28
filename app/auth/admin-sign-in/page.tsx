// Dedicated admin sign-in page that defaults to the admin dashboard after authentication.
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthSignInForm from "@/components/AuthSignInForm";
import { getSession } from "@/lib/session";
import styles from "../sign-in/SignInLayout.module.css";

export const metadata = {
  title: "เข้าสู่ระบบผู้ดูแลระบบ | HealthCheck CM Price",
};

const adminChecklist = [
  "ตรวจสอบและอนุมัติแพ็กเกจที่โรงพยาบาลส่งเข้ามา",
  "ติดตามรายการที่ผู้ใช้บันทึก/เปรียบเทียบ",
  "ดูสถิติยอดค้นหาและกระแสแพ็กเกจยอดนิยม",
];

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;

  if (session?.user) {
    if (role === "ADMIN" || role === "EDITOR") {
      redirect(callbackUrl);
    }
    redirect("/dashboard");
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
              <h1 className={styles.signInHeroTitle}>เข้าสู่ระบบสำหรับผู้ดูแลระบบ</h1>
              <p className={styles.signInHeroDescription}>
                จัดการแพ็กเกจ ตรวจสอบตะกร้าของผู้ใช้ และดูสถิติภาพรวมได้จากคอนโซลเดียว
              </p>
            </div>
            <ul className={styles.signInHeroList}>
              {adminChecklist.map((item) => (
                <li key={item} className={styles.signInHeroItem}>
                  <span className={styles.signInHeroItemBullet}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.signInHeroFooter}>
            <p>Demo Admin: <span className="font-medium">admin@healthcheck.local</span></p>
            <p className="font-mono text-sm">รหัสผ่าน: admin1234</p>
          </div>
        </aside>

        <section className={styles.signInFormPanel}>
          <div className={styles.signInFormPanelIntro}>
            <h2 className={styles.signInFormPanelTitle}>เข้าสู่แดชบอร์ดแอดมิน</h2>
            <p className={styles.signInFormPanelSubtitle}>
              ใช้บัญชีที่ได้รับสิทธิ์เพื่อจัดการข้อมูลแพ็กเกจและดูรายงานพฤติกรรมการใช้งาน
            </p>
          </div>
          <AuthSignInForm defaultCallbackUrl="/admin" />
          <div className={styles.signInFootnote}>
            ต้องการบัญชีแอดมิน? <Link href="/support/contact">ติดต่อทีมงานเพื่อขอสิทธิ์</Link>
            <br />
            ผู้ใช้ทั่วไป? <Link href="/auth/sign-in">กลับไปเข้าสู่ระบบสำหรับผู้ใช้</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
