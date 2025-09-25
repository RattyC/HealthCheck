"use client";

import { useCompare } from "@/components/CompareContext";

type Props = {
  item: {
    id: string;
    title: string;
    slug: string;
    basePrice: number;
    hospitalName: string;
  };
};

export default function CompareToggleButton({ item }: Props) {
  const compare = useCompare();
  const isSelected = compare.has(item.id);

  return (
    <button
      type="button"
      onClick={() => (isSelected ? compare.remove(item.id) : compare.add(item))}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand ${
        isSelected
          ? "border-brand bg-brand/10 text-brand"
          : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {isSelected ? "เลือกเปรียบเทียบแล้ว" : "เพิ่มเปรียบเทียบ"}
    </button>
  );
}
