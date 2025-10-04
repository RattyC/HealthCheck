"use client";

import { useCompare } from "@/components/CompareContext";
import { useToast } from "@/components/ToastProvider";

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
  const { items, add, remove, has } = useCompare();
  const { push } = useToast();
  const isSelected = has(item.id);

  function handleToggle() {
    if (isSelected) {
      remove(item.id);
      push({ title: "นำออกจากรายการเปรียบเทียบแล้ว", variant: "info" });
      return;
    }

    if (items.length >= 4) {
      push({
        title: "เลือกได้สูงสุด 4 แพ็กเกจ",
        description: "กรุณานำแพ็กเกจบางรายการออกก่อนเพิ่มใหม่",
        variant: "info",
      });
      return;
    }

    add(item);
    const nextCount = items.length + 1;
    push({
      title: "เพิ่มแพ็กเกจในรายการเปรียบเทียบแล้ว",
      description: `เลือกไว้แล้ว ${nextCount}/4 รายการ`,
      variant: "success",
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
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
