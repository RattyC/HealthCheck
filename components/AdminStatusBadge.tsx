export default function AdminStatusBadge({ status }: { status: "DRAFT" | "APPROVED" | "ARCHIVED" }) {
  const color =
    status === "APPROVED" ? "bg-green-100 text-green-700 border-green-200" :
    status === "ARCHIVED" ? "bg-gray-100 text-gray-700 border-gray-200" :
    "bg-yellow-50 text-yellow-800 border-yellow-200";
  const label = status === "APPROVED" ? "Approved" : status === "ARCHIVED" ? "Archived" : "Draft";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${color}`}>{label}</span>;
}

