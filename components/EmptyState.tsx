export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-md border p-8 text-center text-gray-600">
      <div className="text-lg font-medium">{title}</div>
      {hint && <div className="mt-2 text-sm">{hint}</div>}
    </div>
  );
}

