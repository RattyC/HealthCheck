import Link from "next/link";
import { Shield, LayoutDashboard, PackageSearch, ShoppingCart } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["ADMIN", "EDITOR"], "/dashboard");

  const navLinks = [
    { href: "/admin", label: "ภาพรวม", icon: <LayoutDashboard className="h-4 w-4" aria-hidden /> },
    { href: "/admin/packages", label: "แพ็กเกจ", icon: <PackageSearch className="h-4 w-4" aria-hidden /> },
    { href: "/admin/cart", label: "ตะกร้า/คำสั่งซื้อ", icon: <ShoppingCart className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand dark:bg-brand/20">
              <Shield className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">ศูนย์ควบคุมผู้ดูแล</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">จัดการแพ็กเกจ คำสั่งซื้อ และตะกร้าของลูกค้าแบบเรียลไทม์</p>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              กลับหน้าลูกค้า
            </Link>
          </nav>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
