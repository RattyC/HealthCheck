import Link from "next/link";
import type { Metadata } from "next";
import termsRaw from "@/docs/legal/terms-of-service.md?raw";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้บริการ | HealthCheck CM Price",
  description: "ข้อกำหนดการใช้บริการของ HealthCheck CM Price สำหรับผู้ใช้งานในประเทศไทย",
};

export default function TermsPage() {
  return (
    <article className="prose mx-auto max-w-3xl prose-slate dark:prose-invert">
      <Link href="/" className="text-sm text-brand hover:underline">
        ← กลับหน้าแรก
      </Link>
      <div
        className="mt-6"
        dangerouslySetInnerHTML={{ __html: termsRaw }}
      />
    </article>
  );
}
