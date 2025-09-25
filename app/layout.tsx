import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";

const title = "HealthCheck CM Price";
const description = "เทียบราคาแพ็กเกจตรวจสุขภาพเชียงใหม่ เปรียบเทียบได้ในไม่กี่คลิก";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(baseUrl),
  openGraph: {
    title,
    description,
    url: baseUrl,
    siteName: title,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <ToastProvider>
            <header className="border-b border-slate-200 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
              <div className="container-page flex h-14 items-center justify-between gap-4">
                <Link href="/" className="font-semibold tracking-tight hover:text-brand">
                  HealthCheck CM Price
                </Link>
                <div className="flex items-center gap-3">
                  <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                    <Link href="/packages" className="hover:text-slate-900 dark:hover:text-white">
                      แพ็กเกจ
                    </Link>
                    <Link href="/admin" className="hover:text-slate-900 dark:hover:text-white">
                      แอดมิน
                    </Link>
                  </nav>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <main className="py-6">
              <div className="container-page">{children}</div>
            </main>
            <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              © {new Date().getFullYear()} HealthCheck CM Price · Chiang Mai, Thailand
            </footer>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
