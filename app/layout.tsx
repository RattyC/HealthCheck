import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AppProviders from "@/components/AppProviders";
import { getSession } from "@/lib/session";
import UserMenu from "@/components/UserMenu";
import CompareBar from "@/components/CompareBar";
import CommandMenu from "@/components/CommandMenu";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

const title = "HealthCheck CM Price";
const description = "เทียบราคาแพ็กเกจตรวจสุขภาพเชียงใหม่ เปรียบเทียบได้ในไม่กี่คลิก";
const FALLBACK_BASE_URL = "http://localhost:3000";
const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || FALLBACK_BASE_URL;
const metadataBase = (() => {
  try {
    return new URL(rawBaseUrl);
  } catch {
    return new URL(FALLBACK_BASE_URL);
  }
})();
const canonicalUrl = metadataBase.toString().replace(/\/$/, "");

export const metadata: Metadata = {
  title,
  description,
  metadataBase,
  openGraph: {
    title,
    description,
    url: canonicalUrl,
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
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon-precomposed.png" },
    ],
    shortcut: [
      { url: "/favicon.ico" },
    ],
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: canonicalUrl,
  },
  other: {
    "theme-color": "#0ea5a0",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "EDITOR";
  const isAuthenticated = Boolean(session?.user);
  const navLinks = [
    { href: "/packages", label: "แพ็กเกจสุขภาพ" },
    { href: "/insurance", label: "ประกันสุขภาพ" },
    { href: "/cart", label: "ตะกร้า" },
  ];
  if (isAuthenticated) {
    navLinks.push({ href: "/dashboard", label: "บัญชีของฉัน" });
  }
  if (isAdmin) {
    navLinks.push({ href: "/admin", label: "ศูนย์ผู้ดูแล" });
  }
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-150 dark:bg-slate-950 dark:text-slate-100">
        <AppProviders session={session}>
            <header className="border-b border-slate-200 bg-white/60 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
              <div className="container-page flex h-14 items-center justify-between gap-4">
                <Link href="/" className="interactive-link font-semibold tracking-tight text-slate-900 dark:text-white">
                  HealthCheck CM Price
                </Link>
                <div className="flex items-center gap-3">
                  <nav className="flex flex-wrap items-center gap-3 text-sm">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="interactive-link">
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <UserMenu session={session} />
                  </div>
                </div>
              </div>
            </header>
            <main className="py-6">
              <div className="container-page">{children}</div>
            </main>
            <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              © {new Date().getFullYear()} HealthCheck CM Price · Chiang Mai, Thailand
            </footer>
            <CompareBar />
            <CommandMenu />
        </AppProviders>
      </body>
    </html>
  );
}
