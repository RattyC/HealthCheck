import { prisma } from "@/lib/prisma";

export const revalidate = 300;

type PackageDetail = Awaited<ReturnType<typeof prisma.healthPackage.findFirst>>;

export default async function PackageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("demo-")) {
    return (
      <article className="space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">ตัวอย่างแพ็กเกจ (Demo)</h1>
            <div className="text-sm text-gray-600">Demo Hospital</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">฿1,990</div>
          </div>
        </header>
        <section>
          <h2 className="mb-2 text-lg font-semibold">รายการตรวจ (3)</h2>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {['CBC','FBS','Chest X-ray'].map((n) => (
              <li key={n} className="rounded border px-3 py-2 text-sm">{n}</li>
            ))}
          </ul>
        </section>
        <div className="text-sm text-gray-600">ที่มา: ตัวอย่างข้อมูลเพื่อแสดงผล UI</div>
      </article>
    );
  }
  let pkg: PackageDetail | null = null;
  try {
    pkg = await prisma.healthPackage.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        hospital: true,
        includes: true,
        histories: { orderBy: { recordedAt: "desc" }, take: 12 },
      },
    });
  } catch (error) {
    console.error("Failed to load package detail", error);
    pkg = null;
  }
  if (!pkg) return <div className="text-gray-600">ไม่พบแพ็กเกจหรือฐานข้อมูลยังไม่พร้อม</div>;

  return (
    <article className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{pkg.title}</h1>
          <div className="text-sm text-gray-600">{pkg.hospital?.name}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">฿{pkg.basePrice.toLocaleString()}</div>
          {pkg.priceNote && <div className="text-xs text-gray-500">{pkg.priceNote}</div>}
        </div>
      </header>

      {pkg.description && <p className="text-gray-700">{pkg.description}</p>}

      <section>
        <h2 className="mb-2 text-lg font-semibold">รายการตรวจ ({pkg.includes.length})</h2>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.includes.map((item) => (
            <li key={item.id} className="rounded border px-3 py-2 text-sm">{item.name}</li>
          ))}
        </ul>
      </section>

      {pkg.histories?.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">ประวัติราคา</h2>
          <ul className="text-sm text-gray-600">
            {pkg.histories.map((history) => (
              <li key={history.id}>฿{history.price.toLocaleString()} • {new Date(history.recordedAt).toLocaleDateString()}</li>
            ))}
          </ul>
        </section>
      )}

      {pkg.sourceUrl && (
        <div className="text-sm text-gray-600">
          ที่มา: <a className="text-brand underline" href={pkg.sourceUrl} target="_blank">ลิงก์อ้างอิง</a>
        </div>
      )}
    </article>
  );
}
