import Link from "next/link";
import type { Metadata } from "next";
import privacyRaw from "@/docs/legal/privacy-policy.md?raw";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | HealthCheck CM Price",
  description: "นโยบายความเป็นส่วนตัวสำหรับผู้ใช้งาน HealthCheck CM Price",
};

export default function PrivacyPage() {
  return (
    <article className="prose mx-auto max-w-3xl prose-slate dark:prose-invert">
      <Link href="/" className="text-sm text-brand hover:underline">
        ← กลับหน้าแรก
      </Link>
      <div className="mt-6" dangerouslySetInnerHTML={{ __html: privacyRaw }} />
    </article>
  );
}
