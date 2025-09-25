export default function Page() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">เทียบแพ็กเกจตรวจสุขภาพเชียงใหม่</h1>
      <p className="text-slate-600 dark:text-slate-300">
        ค้นหา ฟิลเตอร์ และเปรียบเทียบแพ็กเกจจากหลายโรงพยาบาลในเชียงใหม่
      </p>
      <div>
        <a
          href="/packages"
          className="inline-flex items-center rounded-md bg-brand px-4 py-2 font-medium text-white shadow transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 dark:focus:ring-offset-slate-950"
        >
          เริ่มค้นหาแพ็กเกจ
        </a>
      </div>
    </section>
  );
}
