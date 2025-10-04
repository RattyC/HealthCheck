import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | HealthCheck CM Price",
  description: "นโยบายความเป็นส่วนตัวของ HealthCheck CM Price อธิบายการเก็บและใช้ข้อมูลผู้ใช้",
};

const sections = [
  {
    title: "1. ข้อมูลที่เก็บรวบรวม",
    body: [
      "ข้อมูลบัญชี เช่น ชื่อ อีเมล รหัสผ่านที่แฮชแล้ว",
      "กิจกรรมการใช้งาน เช่น การค้นหา การเปรียบเทียบ การเพิ่มลงตะกร้า",
      "ข้อมูลอุปกรณ์ เช่น IP address ประเภทเบราว์เซอร์ คุกกี้",
      "รายละเอียดการจองหรือสอบถามแพ็กเกจที่คุณส่งผ่านแพลตฟอร์ม",
    ],
  },
  {
    title: "2. วัตถุประสงค์การใช้ข้อมูล",
    body: [
      "ให้บริการและพัฒนาประสบการณ์การค้นหาแพ็กเกจสุขภาพ",
      "ส่งคำแนะนำ โปรโมชั่น และการอัปเดตราคา",
      "ประสานงานกับโรงพยาบาลหรือพันธมิตรเมื่อคุณร้องขอ",
      "ป้องกันการใช้งานผิดวิธีและรักษาความปลอดภัยของระบบ",
    ],
  },
  {
    title: "3. การแบ่งปันข้อมูล",
    body: [
      "โรงพยาบาลหรือทีมคอนเซียร์จเพื่อดำเนินการตามคำขอของคุณ",
      "ผู้ให้บริการด้านโครงสร้างพื้นฐานหรือการวิเคราะห์",
      "หน่วยงานภาครัฐหากมีกฎหมายกำหนด",
    ],
  },
  {
    title: "4. ระยะเวลาเก็บข้อมูล",
    body: [
      "เราเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการหรือข้อผูกพันตามกฎหมาย",
      "ผู้ใช้สามารถขอลบบัญชีและข้อมูลส่วนตัวได้",
    ],
  },
  {
    title: "5. คุกกี้และเทคโนโลยีติดตาม",
    body: [
      "ใช้เพื่อการยืนยันตัวตน จดจำการตั้งค่า และวิเคราะห์การใช้งาน",
      "คุณสามารถตั้งค่าเบราว์เซอร์เพื่อปฏิเสธคุกกี้ แต่บางฟีเจอร์อาจใช้ไม่ได้เต็มที่",
    ],
  },
  {
    title: "6. สิทธิของผู้ใช้",
    body: [
      "เข้าถึงหรือแก้ไขข้อมูล",
      "ขอให้ลบหรือจำกัดการประมวลผล",
      "คัดค้านการใช้งานหรือเพิกถอนความยินยอม",
      "ขอรับข้อมูลในรูปแบบที่โอนย้ายได้",
    ],
  },
  {
    title: "7. การรักษาความปลอดภัย",
    body: [
      "เราใช้วิธีการทางเทคนิค เช่น การเข้ารหัส การจำกัดสิทธิ์ และการบันทึกกิจกรรม",
      "หากพบเหตุการณ์ที่เกี่ยวข้องกับข้อมูลส่วนบุคคลจะรีบแจ้งให้คุณทราบ",
    ],
  },
  {
    title: "8. การโอนข้อมูลข้ามประเทศ",
    body: [
      "ข้อมูลอาจถูกประมวลผลในเซิร์ฟเวอร์นอกประเทศไทย โดยมีมาตรการคุ้มครองตามสมควร",
    ],
  },
  {
    title: "9. เด็กและเยาวชน",
    body: [
      "บริการไม่เหมาะสำหรับเด็กอายุต่ำกว่า 13 ปี หากพบว่ามีการเก็บข้อมูลของเด็กจะลบทันที",
    ],
  },
  {
    title: "10. การติดต่อ",
    body: [
      "อีเมล: privacy@healthcheck.cm",
      "ที่อยู่: HealthCheck CM Price, Chiang Mai, Thailand",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-brand hover:underline">
          ← กลับหน้าแรก
        </Link>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">นโยบายความเป็นส่วนตัว</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">อัปเดตล่าสุด: ตุลาคม 2567</p>
      </header>
      <div className="space-y-5 text-sm text-slate-600 dark:text-slate-300">
        {sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{section.title}</h2>
            <ul className="space-y-1">
              {section.body.map((paragraph) => (
                <li key={paragraph} className="leading-relaxed">
                  {paragraph}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
