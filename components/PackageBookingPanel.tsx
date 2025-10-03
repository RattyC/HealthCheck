"use client";

import { useMemo, useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";

type PromotionOption = {
  code: string;
  label: string;
  description?: string;
  discountLabel?: string;
  eligibilityNote?: string;
  recommended?: boolean;
};

type Props = {
  packageId: string;
  initialInCart: boolean;
  promotions: PromotionOption[];
};

function nextAvailableSlot() {
  const now = new Date();
  if (now.getHours() >= 18) {
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
  }
  const rounded = new Date(now);
  const minutes = rounded.getMinutes();
  const remainder = minutes % 30;
  if (remainder !== 0) {
    rounded.setMinutes(minutes + (30 - remainder), 0, 0);
  }
  return rounded;
}

export default function PackageBookingPanel({ packageId, initialInCart, promotions }: Props) {
  const recommendedPromotion = useMemo(
    () => promotions.find((option) => option.recommended) ?? promotions[0] ?? null,
    [promotions]
  );

  const [selectedPromotion, setSelectedPromotion] = useState<PromotionOption | null>(recommendedPromotion);
  const initialSlot = useMemo(() => nextAvailableSlot(), []);
  const [scheduledInput, setScheduledInput] = useState<string>(initialSlot.toISOString().slice(0, 16));
  const [scheduledIso, setScheduledIso] = useState<string | null>(initialSlot.toISOString());

  function handleScheduleChange(value: string) {
    setScheduledInput(value);
    if (!value) {
      setScheduledIso(null);
      return;
    }
    const candidate = new Date(value);
    if (Number.isNaN(candidate.getTime())) {
      setScheduledIso(null);
      return;
    }
    setScheduledIso(candidate.toISOString());
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">เลือกโปรโมชั่นและจองคิว</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          เลือกสิทธิพิเศษที่ตรงใจและกำหนดวันเวลาที่ต้องการเข้ารับบริการได้ทันที ก่อนเพิ่มลงตะกร้า
        </p>
      </div>

      {promotions.length > 0 ? (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">โปรโมชั่น</span>
          <div className="grid gap-2">
            {promotions.map((option) => {
              const checked = selectedPromotion?.code === option.code;
              return (
                <label
                  key={option.code}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-sm transition hover:border-brand/50 ${
                    checked
                      ? "border-brand bg-brand/10 text-brand dark:border-brand/80 dark:bg-brand/20 dark:text-brand"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="promotion"
                        value={option.code}
                        checked={checked}
                        onChange={() => setSelectedPromotion(option)}
                        className="h-4 w-4 text-brand focus:ring-brand"
                      />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {option.discountLabel ? (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                        {option.discountLabel}
                      </span>
                    ) : null}
                  </div>
                  {option.description ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                  ) : null}
                  {option.eligibilityNote ? (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{option.eligibilityNote}</p>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">วันที่และเวลาที่ต้องการ</span>
          <input
            type="datetime-local"
            value={scheduledInput}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(event) => handleScheduleChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </label>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          เจ้าหน้าที่จะโทรยืนยันคิวและแจ้งเอกสารที่ต้องเตรียมก่อนวันตรวจ
        </p>
      </div>

      <AddToCartButton
        packageId={packageId}
        initialInCart={initialInCart}
        promotion={selectedPromotion ? { code: selectedPromotion.code, label: selectedPromotion.label } : null}
        scheduledFor={scheduledIso}
        requiresSchedule
        requiresPromotion={promotions.length > 0}
      />
    </div>
  );
}
