export default function Page() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">เทียบแพ็กเกจตรวจสุขภาพเชียงใหม่</h1>
      <p className="text-gray-600">
        ค้นหา ฟิลเตอร์ และเปรียบเทียบแพ็กเกจจากหลายโรงพยาบาลในเชียงใหม่
      </p>
      <div>
        <a
          href="/packages"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark"
        >
          เริ่มค้นหาแพ็กเกจ
        </a>
      </div>
    </section>
  );
}

