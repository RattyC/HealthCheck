export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <div className="text-lg font-medium text-slate-900 dark:text-white">{title}</div>
      {hint && <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">{hint}</div>}
    </div>
  );
}
