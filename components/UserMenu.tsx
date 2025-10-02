"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type Props = {
  session: {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: string;
    } | null;
  } | null;
};

export default function UserMenu({ session }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [open]);

  const user = session?.user;
  if (!user || typeof user !== "object" || typeof user.id !== "string" || user.id.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/auth/sign-in"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          เข้าสู่ระบบ
        </Link>
        <Link
          href="/auth/admin-sign-in"
          className="rounded-md border border-brand/40 px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-brand hover:text-white dark:border-brand/60 dark:text-brand dark:hover:text-white"
        >
          แอดมิน
        </Link>
      </div>
    );
  }

  const initials = user.name?.slice(0, 1)?.toUpperCase() ?? user.email?.slice(0, 1)?.toUpperCase() ?? "U";
  const roleValue = typeof user.role === "string" ? user.role : "USER";
  const isAdmin = roleValue === "ADMIN" || roleValue === "EDITOR";
  const roleBadge = roleValue === "ADMIN" ? "ADMIN" : roleValue === "EDITOR" ? "EDITOR" : "USER";
  const roleLabel = roleValue === "ADMIN" ? "ผู้ดูแลระบบ" : roleValue === "EDITOR" ? "ผู้ดูแลคอนเทนต์" : "ผู้ใช้งาน";
  const displayEmail = typeof user.email === "string" && user.email.length > 0 ? user.email : "-";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-300">
            <div className="font-semibold text-slate-800 dark:text-white">{user.name ?? user.email}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{displayEmail}</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {roleBadge}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">บทบาท: {roleLabel}</div>
          </div>
          <div className="flex flex-col py-1 text-sm">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-left text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              แดชบอร์ดของฉัน
            </Link>
            <Link
              href="/bookmarks"
              className="px-4 py-2 text-left text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              โปรโมชันที่บันทึกไว้
            </Link>
            <Link
              href="/cart"
              className="px-4 py-2 text-left text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              ตะกร้าของฉัน
            </Link>
            {isAdmin && (
              <>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <Link
                  href="/admin"
                  className="px-4 py-2 text-left text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setOpen(false)}
                >
                  แดชบอร์ดแอดมิน
                </Link>
                <Link
                  href="/admin/cart"
                  className="px-4 py-2 text-left text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => setOpen(false)}
                >
                  ตะกร้าผู้ใช้
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-left text-sm text-rose-500 transition hover:bg-rose-50 dark:border-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
