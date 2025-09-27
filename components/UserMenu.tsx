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
      <Link
        href="/auth/sign-in"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        เข้าสู่ระบบ
      </Link>
    );
  }

  const initials = user.name?.slice(0, 1)?.toUpperCase() ?? user.email?.slice(0, 1)?.toUpperCase() ?? "U";

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
            <div className="truncate text-xs text-slate-500">{user.email}</div>
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
              บันทึกของฉัน
            </Link>
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
