import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  hint?: string;
  icon?: ReactNode;
};

export default function EmptyState({ title, hint, icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-10 text-center text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
      {icon && <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</div>}
      <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
      {hint && <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">{hint}</div>}
    </div>
  );
}
