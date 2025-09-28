// Compare library shows saved comparison snapshots for the current user.
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guard";
import EmptyState from "@/components/EmptyState";

export const metadata = {
  title: "ลิงก์เปรียบเทียบของฉัน | HealthCheck CM Price",
};

export default async function CompareLibraryPage() {
  const user = await requireUser("/compare/library");
  const snapshots = await prisma.compareSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">ลิงก์เปรียบเทียบของฉัน</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          เก็บลิงก์เปรียบเทียบที่คุณสร้างไว้เพื่อกลับมาดูหรือแชร์ให้ทีมงานได้ทุกเมื่อ
        </p>
      </div>

      {snapshots.length === 0 ? (
        <EmptyState
          title="ยังไม่มีลิงก์เปรียบเทียบ"
          hint="เลือกแพ็กเกจ 2–4 รายการแล้วกดปุ่มแชร์ในหน้า Compare เพื่อบันทึกลิงก์"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{snapshot.slug}</div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistanceToNow(snapshot.createdAt, { addSuffix: true, locale: th })}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {snapshot.packageIds.join(", ")}
              </div>
              <div className="flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/compare?slug=${snapshot.slug}`}
                  className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
                >
                  เปิดลิงก์
                </Link>
                {snapshot.expiresAt && (
                  <span className="text-xs text-slate-400">หมดอายุ {formatDistanceToNow(snapshot.expiresAt, { addSuffix: true, locale: th })}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
