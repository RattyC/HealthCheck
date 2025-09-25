import AdminStatusBadge from "@/components/AdminStatusBadge";
import AdminActions from "@/components/AdminActions";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

export default async function AdminPackages() {
  let items: any[] = [];
  try {
    items = await prisma.healthPackage.findMany({
      orderBy: { updatedAt: "desc" },
      include: { hospital: true, _count: { select: { includes: true } } },
      take: 100,
    });
  } catch {}

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">จัดการแพ็กเกจ</h1>
      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <tr>
              <th className="p-2 text-left font-semibold">แพ็กเกจ</th>
              <th className="p-2 text-left font-semibold">โรงพยาบาล</th>
              <th className="p-2 text-right font-semibold">ราคา</th>
              <th className="p-2 text-center font-semibold">สถานะ</th>
              <th className="p-2 text-left font-semibold">อัปเดต</th>
              <th className="p-2 text-left font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
                <td className="p-2">
                  <div className="font-medium text-slate-900 dark:text-white">{p.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{p._count?.includes ?? 0} รายการตรวจ</div>
                </td>
                <td className="p-2 text-slate-700 dark:text-slate-300">{p.hospital?.name ?? '-'}</td>
                <td className="p-2 text-right text-slate-700 dark:text-slate-200">฿{p.basePrice.toLocaleString()}</td>
                <td className="p-2 text-center"><AdminStatusBadge status={p.status} /></td>
                <td className="p-2 text-xs text-slate-500 dark:text-slate-400">{new Date(p.updatedAt).toLocaleString()}</td>
                <td className="p-2"><AdminActions id={p.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
