export default function AdminStatusBadge({ status }: { status: "DRAFT" | "APPROVED" | "ARCHIVED" }) {
  const color =
    status === "APPROVED"
      ? "border-green-200 bg-green-100 text-green-700 dark:border-green-400/40 dark:bg-green-500/10 dark:text-green-200"
      : status === "ARCHIVED"
      ? "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/50 dark:bg-amber-500/10 dark:text-amber-200";
  const label = status === "APPROVED" ? "Approved" : status === "ARCHIVED" ? "Archived" : "Draft";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${color}`}>{label}</span>;
}
