import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HealthCheck CM Price",
  description: "เทียบราคาแพ็กเกจตรวจสุขภาพเชียงใหม่",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen">
        <header className="border-b">
          <div className="container-page flex h-14 items-center justify-between">
            <a href="/" className="font-semibold">HealthCheck CM Price</a>
            <nav className="text-sm text-gray-600">
              <a href="/packages" className="hover:text-gray-900">แพ็กเกจ</a>
            </nav>
          </div>
        </header>
        <main className="py-6">
          <div className="container-page">{children}</div>
        </main>
        <footer className="border-t py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} HealthCheck CM Price
        </footer>
      </body>
    </html>
  );
}

