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
      <h1 className="text-2xl font-bold">จัดการแพ็กเกจ</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">แพ็กเกจ</th>
              <th className="p-2 text-left">โรงพยาบาล</th>
              <th className="p-2 text-right">ราคา</th>
              <th className="p-2 text-center">สถานะ</th>
              <th className="p-2 text-left">อัปเดต</th>
              <th className="p-2 text-left">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-gray-500">{p._count?.includes ?? 0} รายการตรวจ</div>
                </td>
                <td className="p-2">{p.hospital?.name ?? '-'}</td>
                <td className="p-2 text-right">฿{p.basePrice.toLocaleString()}</td>
                <td className="p-2 text-center"><AdminStatusBadge status={p.status} /></td>
                <td className="p-2 text-xs text-gray-500">{new Date(p.updatedAt).toLocaleString()}</td>
                <td className="p-2"><AdminActions id={p.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

